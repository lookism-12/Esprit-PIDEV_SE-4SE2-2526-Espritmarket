import 'reflect-metadata';
import 'zone.js';
import 'zone.js/testing';
import { getTestBed } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import * as jasmineMod from 'jasmine-core';

// Expose jasmine globally
(global as any).jasmine = (jasmineMod as any).jasmine;

let testBedInitialized = false;

beforeAll(() => {
  if (!testBedInitialized) {
    getTestBed().initTestEnvironment(
      BrowserDynamicTestingModule,
      platformBrowserDynamicTesting()
    );
    testBedInitialized = true;
  }
});

beforeEach(() => {
  getTestBed().resetTestingModule();
});





