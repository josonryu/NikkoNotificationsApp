/// <reference path="../reference.d.ts" />
App.controller('applicationCompSendFailedController', ['$scope', '$controller', 'logicCom', 'AppBizCom',
    function ($scope, $controller, logicCom, AppBizCom) {

        // ホーム遷移確認画面の継承
        $controller('applicationCompReturnHomeModalController', { $scope: $scope });

        var scrollLock = function () {
            $('.scrollArea').css({ '-webkit-overflow-scrolling': 'auto' });
        };

        /** 画面ID. */
        $scope.PAGE_ID = 'G1270-03';

        var init = function () {

            var erviceTimeJoho: any = AppBizCom.DataHolder.getServiceTime();
            var LOGIN_SYRY_ZKK: string = erviceTimeJoho.LOGIN_SYRY_ZKK;
            $scope.LOGIN_SYRY_ZKK = Number(LOGIN_SYRY_ZKK.substr(0, 2)) + ':' + LOGIN_SYRY_ZKK.substr(3, 2);

        };

        /**
         * イベント：「ホームへ戻る」ボタンタップ
         * 
         * @returns void
         */
        $scope.returnHome = function (): void {

            // アクションログ出力
            logicCom.btnTapLog($scope.PAGE_ID, $scope.TO_PAGE_ID, $scope.RETURN_HOME_BTN_NAME);

            // ホーム遷移確認画面を表示
            scrollLock();
            $('body').addClass('is-modal-open');
            $("#G1270-04").modal("show");

        };

        init();
    }]);