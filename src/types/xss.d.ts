declare module "xss" {
  type XssOptions = Record<string, unknown>;
  export default function xss(html: string, options?: XssOptions): string;
}
