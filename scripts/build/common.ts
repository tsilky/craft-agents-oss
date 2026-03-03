/**
 * Build utilities stub for OSS fork.
 * The upstream build/common module handles uv binary bootstrapping
 * for production builds. In the OSS fork, uv is not bundled.
 */

export type Platform = "darwin" | "win32" | "linux";
export type Arch = "arm64" | "x64";

export interface DownloadUvOptions {
  platform: Platform;
  arch: Arch;
  upload: boolean;
  uploadLatest: boolean;
  uploadScript: boolean;
  rootDir: string;
  electronDir: string;
}

export async function downloadUv(_options: DownloadUvOptions): Promise<void> {
  console.log("⏭️  uv bootstrap skipped (OSS fork — not bundled)");
}
