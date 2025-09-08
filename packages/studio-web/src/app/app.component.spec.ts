import { ToastrModule } from "ngx-toastr";

import { HttpClient, provideHttpClient } from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";

import { AppComponent } from "./app.component";
import { DemoComponent } from "./demo/demo.component";
import { MaterialModule } from "./material.module";
import { UploadComponent } from "./upload/upload.component";
import { provideRouter } from "@angular/router";
import { AppRoutingModule, routes } from "./app-routing.module";

describe("AppComponent", () => {
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
        AppRoutingModule,
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter(routes),
      ],
      declarations: [AppComponent, UploadComponent, DemoComponent],
    }).compileComponents();
    httpClient = TestBed.inject(HttpClient);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  it("should create the app", () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });
});
