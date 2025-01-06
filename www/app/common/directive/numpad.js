/// <reference path="../../reference.d.ts" />
App.directive('numPad', ['AppBizCom', function (AppBizCom) {
        return {
            restrict: 'A',
            link: function (scope, element, attrs) {
                var id = attrs.id;
                var dispPosClass = attrs.numPad ? attrs.numPad : undefined;
                // readonlyを追加
                // element.attr('readonly', 'true');
                if (element[0].id.includes("{{") && element[0].id.includes("}}")) {
                    attrs.$observe('id', function (val) {
                        AppBizCom.NumKeyboard.init([{ id: val, DispPosClass: dispPosClass }]);
                    });
                }
                else {
                    AppBizCom.NumKeyboard.init([{ id: id, DispPosClass: dispPosClass }]);
                }
                // 数字入力項目初期化する時にdocument要素にバインドしたイベントを外す
                // document要素は画面共通要素なので、イベントを外さないと、次の画面に遷移しても、残っている
                scope.$on('$locationChangeSuccess', function () {
                    document.ontouchstart = null;
                    document.ontouchmove = null;
                });
            }
        };
    }]);
