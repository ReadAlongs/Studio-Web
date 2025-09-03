import { ToastrModule } from "ngx-toastr";

import { HttpClient, provideHttpClient } from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";

import { StudioComponent } from "./studio.component";
import { DemoComponent } from "../demo/demo.component";
import { MaterialModule } from "../material.module";
import { UploadComponent } from "../upload/upload.component";
import { provideRouter } from "@angular/router";
import { routes } from "../app-routing.module";

describe("StudioComponent", () => {
  let httpClient: HttpClient;
  let httpTestingController: HttpTestingController;
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ReactiveFormsModule,
        FormsModule,
        BrowserAnimationsModule,
        MaterialModule,
        ToastrModule.forRoot(),
      ],
      providers: [
        provideRouter(routes),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
      declarations: [StudioComponent, UploadComponent, DemoComponent],
    }).compileComponents();
    httpClient = TestBed.inject(HttpClient);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  it("should create the app", () => {
    const fixture = TestBed.createComponent(StudioComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });
});
