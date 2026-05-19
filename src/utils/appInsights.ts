import { ApplicationInsights } from "@microsoft/applicationinsights-web";
import { ReactPlugin } from "@microsoft/applicationinsights-react-js";

const connectionString = import.meta.env.VITE_APPINSIGHTS_CONNECTION_STRING;

export const reactPlugin = new ReactPlugin();

export const appInsights = new ApplicationInsights({
  config: {
    connectionString,
    extensions: [reactPlugin],
    enableAutoRouteTracking: true,
    // Cross-origin correlation injects `Request-Id` / `traceparent` headers
    // into outgoing fetch/XHR calls. Third-party hosts (CARTO basemaps,
    // GeoServer, etc.) don't allow these custom headers in CORS preflight,
    // causing the request to fail. Keep correlation off so the map can load.
    enableCorsCorrelation: false,
    enableRequestHeaderTracking: false,
    enableResponseHeaderTracking: false,
    disableFetchTracking: false,
    disableAjaxTracking: false,
  },
});

if (connectionString) {
  appInsights.loadAppInsights();
  appInsights.trackPageView();
} else if (import.meta.env.DEV) {
  // eslint-disable-next-line no-console
  console.warn(
    "[appInsights] VITE_APPINSIGHTS_CONNECTION_STRING is not set — telemetry disabled."
  );
}
