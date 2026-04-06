import 'zone.js';
import 'zone.js/testing';
import '@angular/compiler';
import { getTestBed } from '@angular/core/testing';

console.log('--- SETUP-VITEST EXECUTING ---');
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting,
} from '@angular/platform-browser-dynamic/testing';

// Import to fix PlatformLocation JIT compilation error
import { provideLocationMocks } from '@angular/common/testing';

// Ensure the TestBed is properly initialized only once
const testBed = getTestBed();
if (!testBed.platform) {
  testBed.initTestEnvironment(
    BrowserDynamicTestingModule,
    platformBrowserDynamicTesting(),
    {
      teardown: { destroyAfterEach: false }
    }
  );
}
