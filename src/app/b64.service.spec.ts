import { TestBed } from "@angular/core/testing";

import { B64Service } from "./b64.service";

describe("B64Service", () => {
  let service: B64Service;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(B64Service);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should turn utf8 to b64 and back", () => {
    let testUTF8 = `󳬏ۓ脶򍫐䏷򻱚1󔊣򧰗J鷍ˑ⨘󝳗ʳꟴ󆋔=є򻥼Ӳ򦿴¦槩7}摠꾀𴮣۝م𬷊
    ,^⒆!טФ񤨷Յe󫱷ъ"Ҁ*=ߋ󻅷񌍖_ᾀ\ꡝ񲁿g"՝MU񔡆ЀL
    劆֒񦘰ˑ{坋𹔸lǼc&񓱬񊄸Ӽ:󌈅=̹ɽ渭觙􈯶൰ȣ¡圤𹷟򱄢揋ﺝ􊃻^
    E̶򱩀򑪟eٌϐ򔜮霗燨综*􍪻񭚴oꕃ𷴨2ҽT񺆥uR혙񗊭:򉪼񙏺ۤƓ騡
    񱺡􌡩PȌ񸛍񩍢􅓴冖㌃ۄ𦄜7Ž⇆*zѱ澁nަvۭË́듍JҢ䆹M󩗟繶`;
    expect(service.b64_to_utf8(service.utf8_to_b64(testUTF8))).toEqual(
      testUTF8
    );
  });
});
