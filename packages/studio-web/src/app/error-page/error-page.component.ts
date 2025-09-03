import { Component, inject, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { environment } from "../../environments/environment";

@Component({
  selector: "app-error-page",
  templateUrl: "./error-page.component.html",
  styleUrls: ["./error-page.component.css"],
  standalone: false,
})
export class ErrorPageComponent implements OnInit {
  protected msg: string | null = null;
  protected errorType: string | null = null;
  protected contactLink = environment.packageJson.contact;
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  ngOnInit(): void {
    this.msg = this.route.snapshot.queryParamMap.get("msg");
    this.errorType = this.route.snapshot.queryParamMap.get("errorType");
  }

  goHome() {
    this.router.navigateByUrl("/");
  }
}
