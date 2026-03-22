export function setAmapSecurityConfig(securityJsCode: string) {
  if (typeof window === "undefined") return;
  window._AMapSecurityConfig = {
    securityJsCode,
  };
}

declare global {
  interface Window {
    _AMapSecurityConfig?: { securityJsCode: string };
  }
}
