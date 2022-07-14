/* tslint:disable */
/* auto-generated angular directive proxies */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, NgZone } from '@angular/core';
import { ProxyCmp, proxyOutputs } from './angular-component-lib/utils';

import { Components } from '@roedoejet/readalong';




export declare interface ReadAlong extends Components.ReadAlong {}

@ProxyCmp({
  defineCustomElementFn: undefined,
  inputs: ['alignment', 'audio', 'cssUrl', 'language', 'pageScrolling', 'svgOverlay', 'text', 'theme', 'useAssetsFolder']
})
@Component({
  selector: 'read-along',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  inputs: ['alignment', 'audio', 'cssUrl', 'language', 'pageScrolling', 'svgOverlay', 'text', 'theme', 'useAssetsFolder']
})
export class ReadAlong {
  protected el: HTMLElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}
