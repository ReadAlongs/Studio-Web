import { query } from "@angular/animations";
import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { map, Observable } from "rxjs";
@Component({
  selector: "app-error-page",
  templateUrl: "./error-page.component.html",
  styleUrls: ["./error-page.component.css"],
})
export class ErrorPageComponent implements OnInit {
  msg: string | null = null;
  errorType: string | null = null;
  constructor(private router: Router, private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.msg = this.route.snapshot.queryParamMap.get("msg");
    this.errorType = this.route.snapshot.queryParamMap.get("errorType");
  }

  goHome() {
    this.router.navigateByUrl("/");
  }
}
