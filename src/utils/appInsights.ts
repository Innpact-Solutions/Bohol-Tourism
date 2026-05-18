import { ApplicationInsights } from "@microsoft/applicationinsights-web";
import { ReactPlugin } from "@microsoft/applicationinsights-react-js";

const connectionString = import.meta.env.VITE_APPINSIGHTS_CONNECTION_STRING;

export const reactPlugin = new ReactPlugin();

export const appInsights = new ApplicationInsights({
  config: {
    connectionString,
    extensions: [reactPlugin],
    enableAutoRouteTracking: true,
    enableCorsCorrelation: true,
    enableRequestHeaderTracking: true,
    enableResponseHeaderTracking: true,
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
