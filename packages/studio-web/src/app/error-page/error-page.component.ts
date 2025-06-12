import { query } from "@angular/animations";
import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { map, Observable } from "rxjs";
import { environment } from "../../environments/environment";
@Component({
  selector: "app-error-page",
  templateUrl: "./error-page.component.html",
  styleUrls: ["./error-page.component.css"],
  standalone: false,
})
export class ErrorPageComponent implements OnInit {
  msg: string | null = null;
  errorType: string | null = null;
  contactLink = environment.packageJson.contact;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    this.msg = this.route.snapshot.queryParamMap.get("msg");
    this.errorType = this.route.snapshot.queryParamMap.get("errorType");
  }

  goHome() {
    this.router.navigateByUrl("/");
  }
}
