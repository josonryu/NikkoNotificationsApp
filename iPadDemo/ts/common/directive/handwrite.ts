/// <reference path="../../reference.d.ts" />
App.directive('handWrite', ['$parse', 'AppBizCom', 'AppCom', function ($parse, AppBizCom, AppCom) {
  return {
    restrict: 'A',
    priority: -1,
    link: function (scope, element, attrs) {

      // ログイン者データの取得．
      var loginInfo: any    = AppBizCom.DataHolder.getLoginInfo();
      var proper   : string = loginInfo.PROPER_C || 'noUser';
      var shop     : string = loginInfo.PROPER_C ? loginInfo.UKETSUKE_MISE_C : '000';
      var section  : string = loginInfo.PROPER_C ? loginInfo.UKETSUKE_KAKARI_C : '0000';

      var id = (<any>attrs).id
      var initInfo = $parse((<any>attrs).handWrite)(scope);

      var name = initInfo.jpName;
      var type = initInfo.handWrite ? initInfo.handWrite : 'text_all';
      var pageID = initInfo.pageID;

      if (element[0].id.includes("{{") && element[0].id.includes("}}")) {
        attrs.$observe('id', function (val) {
          AppBizCom.InputAssistant.init([{ id: val, name: name, type: type }], proper, shop, section, pageID);
        });
      } else {
        AppBizCom.InputAssistant.init([{ id: id, name: name, type: type }], proper, shop, section, pageID);
      }

      scope.$on('$destroy', function () {
          AppBizCom.InputAssistant.deinit(attrs['id']);
      });
    }
  };
}]);