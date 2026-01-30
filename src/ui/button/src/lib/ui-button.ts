import { createProto } from '@angular-proto/core';
import { ProtoFocusVisible } from '@angular-proto/core/focus-visible';
import { ProtoHover } from '@angular-proto/core/hover';
import { ProtoInteract, ProtoInteractButton } from '@angular-proto/core/interact';
import { ProtoPress } from '@angular-proto/core/press';
import { Directive, effect } from '@angular/core';

const protoFor = createProto<UiButton>();

@Directive({
  selector: '[uiButton]',
  exportAs: 'uiButton',
  hostDirectives: [
    ProtoHover,
    ProtoPress,
    ProtoFocusVisible,
    {
      directive: ProtoInteract,
      inputs: [
        'protoInteractDisabled:disable',
        'protoInteractFocusable:focusable',
        'protoInteractTabIndex:tabIndex',
        'protoInteractAriaDisabled:ariaDisabled',
      ],
    },
    {
      directive: ProtoInteractButton,
      inputs: ['protoInteractButtonRole:role', 'protoInteractButtonType:type'],
    },
  ],
  providers: [
    UiButton.State.provide(),
    ProtoInteract.Hooks.provide(state => {
      const ngpHover = ProtoHover.State.inject({ self: true });
      const ngpPress = ProtoPress.State.inject({ self: true });
      const ngpFocusVisible = ProtoFocusVisible.State.inject({ self: true });

      effect(() => {
        const disabled = state().disabled();
        const focusable = state().focusable();
        ngpHover().disabled.control(disabled);
        ngpPress().disabled.control(disabled);
        ngpFocusVisible().disabled.control(disabled && !focusable);
      });
    }),
  ],
})
export class UiButton {
  private static readonly Proto = protoFor(UiButton);
  static readonly State = UiButton.Proto.state;
  static readonly Hooks = UiButton.Proto.hooks;

  readonly state = UiButton.Proto(this);
}
