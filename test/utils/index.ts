export function zeropad(n: number): string {
  return (n < 10 ? "00" : n < 100 ? "0" : "") + String(n);
}

export function escapeXml(str: string): string {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export async function catchError(
  execCb: () => Promise<void>,
  callback: (e?: Error) => void
): Promise<void> {
  try {
    await execCb();
  } catch (e) {
    callback(e);
    return;
  }
  callback();
}
