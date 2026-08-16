import { AbilityConstant, UIAbility, Want } from '@kit.AbilityKit';
import { hilog } from '@kit.PerformanceAnalysisKit';
import { window } from '@kit.ArkUI';

export default class EntryAbility extends UIAbility {
  onCreate(want: Want, launchParam: AbilityConstant.LaunchParam): void {
    hilog.info(0x0000, 'YangCun', 'Ability onCreate');
  }

  onDestroy(): void {
    hilog.info(0x0000, 'YangCun', 'Ability onDestroy');
  }

  onWindowStageCreate(windowStage: window.WindowStage): void {
    windowStage.loadContent('pages/Index', (err) => {
      if (err.code) {
        hilog.error(0x0000, 'YangCun', 'Failed to load content: %{public}s', JSON.stringify(err));
        return;
      }
      hilog.info(0x0000, 'YangCun', 'Content loaded');
    });
  }

  onWindowStageDestroy(): void {
    hilog.info(0x0000, 'YangCun', 'WindowStage destroyed');
  }

  onForeground(): void {
    hilog.info(0x0000, 'YangCun', 'Ability onForeground');
  }

  onBackground(): void {
    hilog.info(0x0000, 'YangCun', 'Ability onBackground');
  }
}
