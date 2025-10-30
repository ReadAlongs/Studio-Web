import { Component, computed, input } from "@angular/core";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";

@Component({
  selector: "g2p-error",
  template: `<div [ngClass]="class()">
    <h3>
      {{ this.parsedHeader() }}
      <div i18n="g2p advice" class="text-info">
        Common issues include stray diacritics and numbers or dates represented
        as digits instead of words.
      </div>
      <div i18n="g2p error highlights" class="text-info">
        Characters/symbols/punctuations that prevented our system from
        processing your text are highlighted below:
      </div>
    </h3>
    <div>
      @for (page of this.parsedPages(); track $index) {
        <div>
          @for (sentence of getSentencesFromPage(page); track $index) {
            <p>
              @for (word of getWordsFromSentence(sentence); track $index) {
                <span [class]="wordClass(word)"> {{ word.textContent }} </span>
              }
            </p>
          }
        </div>
      }
    </div>
  </div>`,
  styleUrls: ["./g2p.error.component.sass"],
  imports: [BrowserAnimationsModule],
})
export class G2PErrorComponent {
  errorMessage = input<string | null>("");
  parsedHeader = computed(() => {
    if (this.errorMessage() === "" || this.errorMessage() === null) {
      return "";
    }
    return this.errorMessage()?.split("PARTIAL RAS:")[0];
  });
  parsedPages = computed<HTMLDivElement[]>(() => {
    if (this.errorMessage() === "" || this.errorMessage() === null) {
      return [];
    }

    const xmlDocument = new DOMParser().parseFromString(
      this.errorMessage()?.split("PARTIAL RAS:")[1].trim() ?? "",
      "text/xml",
    );
    return Array.from(xmlDocument.querySelectorAll("div[type=page]"));
  });
  class = computed(() =>
    this.errorMessage() === "" || this.errorMessage() === null
      ? "d-none"
      : "d-block border border-3 border-danger rounded p-3 my-3",
  );
  getSentencesFromPage(page: HTMLDivElement): HTMLElement[] {
    return Array.from(page.querySelectorAll("s"));
  }
  getWordsFromSentence(sentence: HTMLElement): HTMLElement[] {
    return Array.from(sentence.querySelectorAll("w"));
  }
  wordClass(word: HTMLElement): string {
    return word.getAttribute("ARPABET") === ""
      ? "text-danger border border-danger bg-warning"
      : "text-muted";
  }
}
