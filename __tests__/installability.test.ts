
import fs from 'fs';
import path from 'path';

describe('PWA Installability Checks', () => {
  const publicDir = path.join(process.cwd(), 'public');
  const manifestPath = path.join(publicDir, 'manifest.webmanifest');

  test('Manifest file exists and is valid JSON', () => {
    expect(fs.existsSync(manifestPath)).toBe(true);
    const manifestContent = fs.readFileSync(manifestPath, 'utf-8');
    expect(() => JSON.parse(manifestContent)).not.toThrow();
  });

  test('Manifest has required fields for installation', () => {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    
    expect(manifest.name).toBeTruthy();
    expect(manifest.short_name).toBeTruthy();
    expect(manifest.start_url).toBe('/');
    expect(manifest.display).toBe('standalone');
    expect(manifest.icons).toBeTruthy();
    expect(manifest.icons.length).toBeGreaterThanOrEqual(1);
  });

  test('Required icons exist', () => {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    
    manifest.icons.forEach((icon: any) => {
      const iconPath = path.join(publicDir, icon.src);
      expect(fs.existsSync(iconPath)).toBe(true);
    });
  });

  test('Service Worker file exists', () => {
    // Check for sw.js in public (standard PWA)
    const swPath = path.join(publicDir, 'sw.js');
    expect(fs.existsSync(swPath)).toBe(true);
  });
});
