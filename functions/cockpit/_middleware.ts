import {
  authenticateCockpit,
  privateHeaders,
  secureResponse,
  SecurityError,
  type CockpitEnv,
} from "../_lib/cockpit/security";

function denied(error: SecurityError): Response {
  const headers = privateHeaders("text/plain; charset=utf-8");
  return new Response(error.status === 401 ? "Accès privé requis." : "Accès refusé.", {
    status: error.status,
    headers,
  });
}

interface MiddlewareContext {
  request: Request;
  env: CockpitEnv;
  next(): Promise<Response>;
}

export const onRequest = async (context: MiddlewareContext): Promise<Response> => {
  try {
    await authenticateCockpit(context.request, context.env);
    return secureResponse(await context.next());
  } catch (error) {
    if (error instanceof SecurityError) return denied(error);
    return denied(new SecurityError(500, "INTERNAL_ERROR", "Le contrôle d'accès a échoué."));
  }
};
