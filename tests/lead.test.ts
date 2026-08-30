import { afterEach, describe, expect, it, vi } from 'vitest';

import { onRequest } from '../functions/api/lead';

type LeadContext = Parameters<typeof onRequest>[0];

let numeroIp = 10;

function contact(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    type: 'contact',
    consentement: true,
    prenom: 'Mouaad',
    nom: 'Boullourou',
    email: 'mouaad@example.test',
    objet: 'Question',
    message: 'Bonjour',
    ...overrides,
  };
}

function contexte(
  body: unknown,
  env: Record<string, unknown> = {},
  options: { method?: string; ip?: string; brut?: string; contentLength?: string } = {},
): LeadContext {
  const ip = options.ip ?? `203.0.113.${numeroIp++}`;
  const headers: Record<string, string> = {
    'content-type': 'application/json',
    'cf-connecting-ip': ip,
  };
  if (options.contentLength) headers['content-length'] = options.contentLength;
  const request = new Request('https://levois.fr/api/lead', {
    method: options.method ?? 'POST',
    headers,
    ...(options.method === 'GET' ? {} : { body: options.brut ?? JSON.stringify(body) }),
  });
  return { request, env } as LeadContext;
}

async function donnees(response: Response): Promise<Record<string, unknown>> {
  return response.json() as Promise<Record<string, unknown>>;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe.sequential('Cloudflare /api/lead', () => {
  it('refuse les méthodes autres que POST sans ouvrir le CORS', async () => {
    const response = await onRequest(contexte(null, {}, { method: 'GET' }));

    expect(response.status).toBe(405);
    expect(response.headers.get('allow')).toBe('POST');
    expect(response.headers.get('access-control-allow-origin')).toBeNull();
    expect(response.headers.get('cache-control')).toBe('no-store');
  });

  it('bloque explicitement une soumission cross-site', async () => {
    const ctx = contexte(contact());
    const headers = new Headers(ctx.request.headers);
    headers.set('origin', 'https://spam.example');
    const request = new Request(ctx.request, { headers });

    const response = await onRequest({ ...ctx, request });

    expect(response.status).toBe(403);
    expect(await donnees(response)).toEqual({ ok: false, message: 'Origine non autorisée.' });
  });

  it('rejette le JSON invalide', async () => {
    const response = await onRequest(contexte(null, {}, { brut: '{invalide' }));

    expect(response.status).toBe(400);
    expect(await donnees(response)).toEqual({ ok: false, message: 'Requête invalide.' });
  });

  it('refuse un corps JSON trop volumineux avec ou sans Content-Length fiable', async () => {
    const streamed = await onRequest(contexte(null, {}, {
      brut: JSON.stringify({ ...contact(), padding: 'x'.repeat(70_000) }),
    }));
    expect(streamed.status).toBe(413);

    const declared = await onRequest(contexte(contact(), {}, { contentLength: '70000' }));
    expect(declared.status).toBe(413);
  });

  it('neutralise le honeypot sans contacter Resend', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const response = await onRequest(contexte({ site_web: 'robot' }));

    expect(response.status).toBe(200);
    expect(await donnees(response)).toEqual({ ok: true, delivered: false });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('conserve les validations historiques, dont la commune pour un parcours', async () => {
    const response = await onRequest(
      contexte({ type: 'parcours', consentement: true, prenom: 'Mouaad', nom: 'B.', email: 'mouaad@example.test' }),
    );

    expect(response.status).toBe(400);
    expect(await donnees(response)).toEqual({ ok: false, message: 'Champs à vérifier : commune.' });
  });

  it('accepte et transmet exactement la charge utile réelle de /votre-rue sans nom', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('{"id":"email_votre_rue"}', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    // Même forme que le payload construit dans src/pages/votre-rue.astro.
    const payload = {
      type: 'votre-rue',
      consentement: true,
      source: 'QR /votre-rue',
      adresseRecherchee: '8 rue de la République, 28300 Lèves',
      commune: 'Lèves',
      typeBien: 'Maison',
      periodeDu: '2021-01-04',
      periodeAu: '2025-12-31',
      intention: 'Je réfléchis à vendre',
      intentionKey: 'reflexion',
      profil: 'Vendeur potentiel',
      qualification: {
        horizon: "Dans l'année",
        typeBien: 'Une maison',
        besoin: 'Préparer la vente',
      },
      prenom: 'Mouaad',
      email: 'mouaad@example.test',
      telephone: '07 00 00 00 00',
      site_web: '',
      contexteInfographie: {
        nbVentes: 65,
        rayon: 1500,
        composition: { maisons: 38, appartements: 27 },
        ppmMaisons: { median: 2353, q1: 1947, q3: 2778 },
        ppmAppartements: { median: 2453, q1: 2190, q3: 2678 },
        tendance: { direction: 'hausse', pct: 1 },
      },
    };

    const response = await onRequest(
      contexte(payload, {
        RESEND_API_KEY: 'test-key',
        LEAD_TO_EMAIL: 'destination@example.test',
        LEAD_FROM_EMAIL: 'LEVOIS <source@example.test>',
      }),
    );

    expect(response.status).toBe(200);
    expect(await donnees(response)).toEqual({ ok: true, delivered: true });
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const email = JSON.parse(String(init.body));
    expect(email.subject).toBe('LEVOIS · Votre rue — Mouaad (Lèves)');
    expect(email.text).toContain('Prénom : Mouaad');
    expect(email.text).toContain('Adresse confirmée : 8 rue de la République, 28300 Lèves');
    expect(email.text).toContain('Type de bien : Maison');
    expect(email.text).toContain('Période de l’échantillon : 2021-01-04 → 2025-12-31');
    expect(email.text).toContain('Intention : Je réfléchis à vendre');
    expect(email.text).toContain('Clé d’intention : reflexion');
    expect(email.text).toContain('Profil : Vendeur potentiel');
    expect(email.text).toContain("· horizon : Dans l'année");
    expect(email.text).toContain('Rayon observé : 1,5 km');
    expect(email.text).toContain('Composition : 38 maisons · 27 appartements');
    expect(email.text).toContain('Maisons : médiane 2 353 €/m² · Q1 1 947 €/m² · Q3 2 778 €/m²');
    expect(email.text).toContain('Tendance observée : hausse · +1,0 %');
  });

  it('aplatit les caractères de contrôle des champs structurés de /votre-rue', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    const response = await onRequest(
      contexte(
        {
          type: 'votre-rue',
          consentement: true,
          prenom: 'Mouaad',
          email: 'mouaad@example.test',
          adresseRecherchee: '8 rue sûre\r\nBcc: tiers@example.test',
          typeBien: 'Appartement',
          periodeDu: '2021-01-04',
          periodeAu: '2025-12-31',
          qualification: { horizon: 'Dans six mois\r\nNouvelle-ligne: injectée' },
        },
        { RESEND_API_KEY: 'test-key' },
      ),
    );

    expect(response.status).toBe(200);
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const email = JSON.parse(String(init.body));
    expect(email.text).toContain('Adresse confirmée : 8 rue sûre Bcc: tiers@example.test');
    expect(email.text).toContain('· horizon : Dans six mois Nouvelle-ligne: injectée');
    expect(email.text).not.toContain('\r');
  });

  it('transmet la lecture structurée de l’audit d’annonce', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('{"id":"email_audit"}', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    const response = await onRequest(
      contexte(
        {
          type: 'audit-annonce',
          consentement: true,
          prenom: 'Camille',
          nom: 'Martin',
          email: 'camille@example.test',
          commune: 'Lèves',
          audit: {
            code: 'premiere-impression',
            titre: 'L’annonce est vue, mais elle ne déclenche pas de contact.',
            resume: 'Le décrochage probable se situe avant le contact.',
            faits: ['Beaucoup de vues.', 'Aucun contact reçu.'],
            actions: ['Comparer la photo principale.'],
            reponses: { duree: '31-60', vues: 'fortes' },
          },
        },
        { RESEND_API_KEY: 'test-key' },
      ),
    );

    expect(response.status).toBe(200);
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const email = JSON.parse(String(init.body));
    expect(email.subject).toBe('LEVOIS · Audit d’annonce — Camille Martin (Lèves)');
    expect(email.text).toContain('Résultat : L’annonce est vue, mais elle ne déclenche pas de contact.');
    expect(email.text).toContain('· Beaucoup de vues.');
    expect(email.text).toContain('· duree : 31-60');
  });

  it('refuse la transmission d’un audit sans consentement explicite', async () => {
    const response = await onRequest(
      contexte({ type: 'audit-annonce', prenom: 'Camille', nom: 'Martin', email: 'camille@example.test' }),
    );
    expect(response.status).toBe(400);
    expect(await donnees(response)).toEqual({ ok: false, message: 'Champs à vérifier : consentement.' });
  });

  it('refuse tout type de charge utile non déclaré', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const response = await onRequest(
      contexte({ ...contact(), type: 'inconnu' }, { RESEND_API_KEY: 'test-key' }),
    );

    expect(response.status).toBe(400);
    expect(await donnees(response)).toEqual({ ok: false, message: 'Champs à vérifier : type.' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('refuse un contact sans consentement, objet ou message', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const response = await onRequest(contexte(contact({ consentement: false, objet: '', message: '' }), { RESEND_API_KEY: 'test-key' }));

    expect(response.status).toBe(400);
    expect(await donnees(response)).toEqual({
      ok: false,
      message: 'Champs à vérifier : consentement, objet, message.',
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('ne transmet rien à un prestataire de secours implicite si Resend est absent', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const response = await onRequest(contexte(contact()));

    expect(response.status).toBe(503);
    expect(await donnees(response)).toMatchObject({ ok: false });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('envoie la synthèse complète avec les bindings Cloudflare historiques', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('{"id":"email_test"}', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    const response = await onRequest(
      contexte(
        {
          type: 'parcours',
          consentement: true,
          prenom: 'Mouaad',
          nom: 'Boullourou',
          email: 'mouaad@example.test',
          commune: 'Lèves',
          telephone: '07 00 00 00 00',
          contexte: {
            situation: 'Projet dans quelques mois',
            reponses: [{ question: 'Quand ?', reponse: 'Dans six mois' }],
          },
        },
        {
          RESEND_API_KEY: 'test-key',
          LEAD_TO_EMAIL: 'destination@example.test',
          LEAD_FROM_EMAIL: 'LEVOIS <source@example.test>',
        },
      ),
    );

    expect(response.status).toBe(200);
    expect(await donnees(response)).toEqual({ ok: true, delivered: true });
    expect(fetchMock).toHaveBeenCalledOnce();

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://api.resend.com/emails');
    expect(init.method).toBe('POST');
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer test-key');

    const email = JSON.parse(String(init.body));
    expect(email).toMatchObject({
      from: 'LEVOIS <source@example.test>',
      to: ['destination@example.test'],
      reply_to: 'mouaad@example.test',
      subject: 'LEVOIS · Mouaad Boullourou — Projet dans quelques mois (Lèves)',
    });
    expect(email.text).toContain('Téléphone : 07 00 00 00 00');
    expect(email.text).toContain('· Quand ? → Dans six mois');
    expect(email.text).toContain('Consentement de transmission : confirmé le');
  });

  it('préserve uniquement une attribution bornée et sans URL personnelle', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('{"id":"email_contact"}', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    const response = await onRequest(
      contexte(
        contact({
          attribution: {
            source: 'linkedin',
            medium: 'social',
            referrerHost: 'www.linkedin.com',
            entryPath: '/camille@example.test?email=camille@example.test',
            campaign: 'camille@example.test',
          },
        }),
        { RESEND_API_KEY: 'test-key' },
      ),
    );

    expect(response.status).toBe(200);
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const email = JSON.parse(String(init.body));
    expect(email.text).toContain('Source : linkedin');
    expect(email.text).toContain('Support : social');
    expect(email.text).toContain('Référent : www.linkedin.com');
    expect(email.text).toContain("Page d’entrée : /other");
    expect(email.text).not.toContain('camille@example.test');
    expect(email.text).not.toContain('campaign');
  });

  it('borne le contexte parcours et ignore les champs libres non contractuels', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('{"id":"email_bounded"}', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    const reponses = Array.from({ length: 25 }, (_, index) => ({
      question: `Question ${index}`,
      reponse: `Réponse ${index}`,
    }));

    const response = await onRequest(contexte({
      type: 'parcours',
      consentement: true,
      prenom: 'Mouaad',
      nom: 'B.',
      email: 'mouaad@example.test',
      commune: 'Lèves',
      contexte: {
        situation: 'Projet vendeur',
        reponses,
        champLibre: 'hors-contrat-secret',
      },
    }, { RESEND_API_KEY: 'test-key' }));

    expect(response.status).toBe(200);
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const email = JSON.parse(String(init.body));
    expect(email.text).toContain('Question 19 → Réponse 19');
    expect(email.text).not.toContain('Question 20');
    expect(email.text).not.toContain('hors-contrat-secret');
  });

  it('renvoie 502 quand Resend refuse le message', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('refus', { status: 422 })));

    const response = await onRequest(
      contexte(
        contact({ nom: 'B.' }),
        { RESEND_API_KEY: 'test-key' },
      ),
    );

    expect(response.status).toBe(502);
    expect(await donnees(response)).toMatchObject({ ok: false });
  });

  it('bloque la sixième tentative de la fenêtre de dix minutes', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    const ip = '198.51.100.42';

    for (let i = 0; i < 5; i += 1) {
      const response = await onRequest(
        contexte(
          contact({ nom: 'B.' }),
          { RESEND_API_KEY: 'test-key' },
          { ip },
        ),
      );
      expect(response.status).toBe(200);
    }

    const response = await onRequest(
      contexte(
        contact({ nom: 'B.' }),
        { RESEND_API_KEY: 'test-key' },
        { ip },
      ),
    );
    expect(response.status).toBe(429);
    expect(fetchMock).toHaveBeenCalledTimes(5);
  });

  it('ne stocke jamais l’adresse IP brute dans la clé de limitation', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    const kv = {
      get: vi.fn().mockResolvedValue(null),
      put: vi.fn().mockResolvedValue(undefined),
    };

    const response = await onRequest(
      contexte(contact(), { RESEND_API_KEY: 'test-key', RATE_LIMIT: kv }, { ip: '198.51.100.201' }),
    );

    expect(response.status).toBe(200);
    const key = String(kv.get.mock.calls[0]?.[0]);
    expect(key).toMatch(/^lead:rl:[a-f0-9]{64}$/);
    expect(key).not.toContain('198.51.100.201');
    expect(kv.put.mock.calls[0]?.[0]).toBe(key);
  });
});
