import { describe, expect, it } from 'vitest';
import { DELIVERY_KEY, deliveryIds, rememberDelivery } from './diagnostic-delivery';
import { parseReading, createContext } from './context';
import { getDiagnosticJourney } from './diagnostics';

function memory(initial = '[]') {
  let value = initial;
  return { getItem: () => value, setItem: (key: string, next: string) => { expect(key).toBe(DELIVERY_KEY); value = next; } };
}
describe('Continuité de la livraison du diagnostic', () => {
  it('conserve uniquement des identifiants de lecture, sans coordonnées et sans doublon', () => {
    const storage = memory();
    expect(rememberDelivery('reading-version-123', storage)).toBe(true);
    rememberDelivery('reading-version-123', storage);
    expect(deliveryIds(storage)).toEqual(['reading-version-123']);
    expect(storage.getItem()).not.toMatch(/email|firstName|phone/);
  });
  it('refuse les marqueurs malformés et borne le nombre de versions', () => {
    expect(deliveryIds(memory('["abc", {"email":"x@example.test"},"<script>"]'))).toEqual([]);
    const storage = memory();
    for(let i=0;i<50;i++)rememberDelivery('reading-version-'+i,storage);
    expect(deliveryIds(storage)).toHaveLength(40);
  });
  it('laisse le contrôleur maintenir la lecture en mémoire si le stockage est bloqué', () => {
    const storage = {getItem(){throw Error('blocked');},setItem(){throw Error('blocked');}};
    expect(deliveryIds(storage)).toEqual([]); expect(rememberDelivery('reading-version-123',storage)).toBe(false);
  });
  it('identifie les nouveaux parcours sans verrouiller rétroactivement les anciennes lectures', () => {
    const reading = getDiagnosticJourney('buyer').buildReading(createContext('buyer'));
    expect(parseReading(reading)?.deliveryMode).toBe('email-arbitrage-v1');
    const {deliveryMode, ...oldReading} = reading;
    expect(parseReading(oldReading)?.deliveryMode).toBeUndefined();
    expect(parseReading({...reading,deliveryMode:'invented'})).toBeNull();
  });
});
