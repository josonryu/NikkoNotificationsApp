/// <reference path="../reference.d.ts" />
App.controller('applicationCompSendSuccessController', ['$scope', '$controller', 'logicCom',
    function ($scope, $controller, logicCom) {

        // ホーム遷移確認画面の継承
        $controller('applicationCompReturnHomeModalController', { $scope: $scope });

        var scrollLock = function () {
            $('.scrollArea').css({ '-webkit-overflow-scrolling': 'auto' });
        };

        /** 画面ID. */
        $scope.PAGE_ID = 'G1270-02';

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

    }]);