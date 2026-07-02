// Angular no longer requires enumerating spec files here; the karma builder
// finds them automatically.
//
// The test environment still needs to be initialized explicitly, though:
// without it, the first NgModule compiled via TestBed silently leaves
// Angular's internal module registry in a broken state (surfaces later as
// `TypeError: Cannot read properties of null (reading 'ngModule')` from
// completely unrelated tests). `@angular/platform-browser-dynamic/testing`
// (the pre-v21 way to do this) no longer exists; this is its replacement.
import "zone.js/testing";
import { getTestBed } from "@angular/core/testing";
import {
  BrowserTestingModule,
  platformBrowserTesting,
} from "@angular/platform-browser/testing";

getTestBed().initTestEnvironment(
  BrowserTestingModule,
  platformBrowserTesting(),
);
