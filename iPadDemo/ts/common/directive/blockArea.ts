/// <reference path="../../reference.d.ts" />
App.directive('blockarea',['$timeout','$parse', ($timeout, $parse) => {
    return {
        restrict: 'E',
        templateUrl:'pages/common/directive/blockArea.html',
        transclude: {
            'baseArea': '?baseArea',
            'inputArea': '?inputArea',
            'despArea': '?despArea',
        },
        require: '?^^scroll', // スクロールディレクティブ導入
        scope:{
            title: '@?', // 該当ブロークのタイトル名
            noBtn: '=?', // 「変更する」ボタン表示、非表示制御フラグ
            link: '&?', // リンクタップ時のイベント
            noLink: '=?', // 詳細リンク表示、非表示制御フラグ
            linkText: '@?', // リンクの内容
            isInputShow: '=?', // 変更あり、なし状態フラグ
            data: '=?', // スコープ内該当グループの入力データオブジェクト
            defaultMap: '=?', // 変更取消時、各入力項目初期化する
            firstArea: '@?', // お客様情報用ブローク制御用フラグ
            confrimBefore: '@?', // 変更前ブローク制御用フラグ
            confrimAfter: '@?', // 変更後ブローク制御用フラグ
            noBorder: '@?', // 罫線なしフラグ
            errItemId: '@?', // 変更前ブロークのエラー表示項目id
            writeBtnLog: '&', // ログ出力処理
            clearOthers: '=?' // 相関エラークリアコールバック関数
        },
        link: ($scope, el, attrs, ctrl) =>{
            // リンクの内容を確定する
            if ((<any>$scope).link && (<any>$scope).linkText == undefined) {
                (<any>$scope).linkText = '詳しくはこちら';
            }

            // 変更あり、なし状態フラグ初期化する
            (<any>$scope).isInputShow === undefined && ((<any>$scope).isInputShow = '0');
            // 「変更する」ボタン名初期化する
            (<any>$scope).btnName = (<any>$scope).isInputShow !== '0' ? '変更取消' : '変更する';
            // 変更取消時、各入力項目初期化する（ディフォルト値セット）
            var getDefaultValue = (prep, defaultMap, defaultVal = undefined): any => {
                return defaultMap != undefined && defaultMap[prep] ? (angular.isObject(defaultMap[prep]) ? angular.copy(defaultMap[prep]) :defaultMap[prep]) : defaultVal;
            }
            // 「変更する」ボタンタップ時のイベント
            (<any>$scope).btnClick = ($event) => {
                // ログ出力
                (<any>$scope).writeBtnLog({isInputShow: (<any>$scope).isInputShow, title: (<any>$scope).title});
                // 変更あり、なし状態フラグを更新する
                (<any>$scope).isInputShow == '0' ? ((<any>$scope).isInputShow = '1') : ((<any>$scope).isInputShow = '0');
                // 「変更する」ボタン名更新する
                (<any>$scope).btnName = (<any>$scope).isInputShow !== '0' ? '変更取消' : '変更する';
                // '変更する'の場合
                if ((<any>$scope).isInputShow == '0'){
                    if (angular.isArray((<any>$scope).data)){
                        (<any>$scope).data = getDefaultValue((<any>attrs).data, (<any>$scope).defaultMap, []);
                    } else if (angular.isObject((<any>$scope).data)){
                        Object.keys((<any>$scope).data).forEach(p => (<any>$scope).data[p] = getDefaultValue(p, (<any>$scope).defaultMap));
                    } else {
                        (<any>$scope).data = (<any>$scope).defaultMap;
                    }
                    // クリアエラー
                    $(el).find('.err').removeClass('err');
                    $(el).find('.err-message').remove();
                    // 相関エラークリア
                    if (angular.isFunction((<any>$scope).clearOthers)) {
                        (<any>$scope).clearOthers();
                    }
                }
                // '変更取消'の場合
                if ((<any>$scope).isInputShow == '1' && (<any>$scope).errItemId){
                    // クリアエラー
                    $(el).find('.err').removeClass('err');
                    $(el).find('.err-message').remove();
                }
            };
            // スクロールディレクティブのコントローラがあれば、行数を計算する
            if (ctrl){
                var number2 = el.find('row').length;
                var number3 = el.find('row-description').length;
                (<any>ctrl).addRows(number2 + number3);
            }
        },
    };
}]);

App.directive('scroll', ['AppBizNaviScroll', '$timeout', (AppBizNaviScroll, $timeout) => {
    return {
        restrict: 'A',
        controller: ['$scope', function scrollCtrl($scope) {
            $scope._rows = 0;
            $scope._readyRows = 0;

            $scope.isAfterInit = false;

            // インデックス(「項目」リンク)
            $scope.gotoAnchor = function (id) {
                AppBizNaviScroll.gotoAnchor(id, true);
            }

            // インデックス(「項目選択」ボタン)
            $scope.navToggle = function () {
                AppBizNaviScroll.navToggle();
                if ($scope.isAfterInit) {
                    $timeout(()=>AppBizNaviScroll.calculate($scope.navilist, 50), 0);
                }
            }

            this.addRows = (r) => $scope._rows = $scope._rows + r;
            this.addReadyRows = (r) => $scope._readyRows = $scope._readyRows + r;

            $scope.$watch('_readyRows', (val) => {
                if (val != 0 && val == $scope._rows) {
                    $scope.navilist = [];

                    var tmpElems = angular.element(document.querySelectorAll('blockarea'));
                    if (!tmpElems || tmpElems.length < 1) {
                        return;
                    }

                    for (var i = 0; i < tmpElems.length; i++) {
                        var tmpTitle = tmpElems[i].title;
                        var tmpId = tmpElems[i].id;
                        if (tmpTitle && tmpId) {
                            $scope.navilist.push({ target: tmpId, navinm: tmpTitle, id: tmpId + 'Link' });
                        }
                    }

                    $timeout(() => {
                        AppBizNaviScroll.init($scope, $scope.navilist, 50);
                        $scope.isAfterInit = true;
                    }, 0);
                }
            });
        }],
    };
}]);