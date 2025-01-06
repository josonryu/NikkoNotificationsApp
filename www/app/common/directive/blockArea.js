/// <reference path="../../reference.d.ts" />
App.directive('blockarea', ['$timeout', '$parse', ($timeout, $parse) => {
        return {
            restrict: 'E',
            templateUrl: 'pages/common/directive/blockArea.html',
            transclude: {
                'baseArea': '?baseArea',
                'inputArea': '?inputArea',
                'despArea': '?despArea',
            },
            require: '?^^scroll',
            scope: {
                title: '@?',
                noBtn: '=?',
                link: '&?',
                noLink: '=?',
                linkText: '@?',
                isInputShow: '=?',
                data: '=?',
                defaultMap: '=?',
                firstArea: '@?',
                confrimBefore: '@?',
                confrimAfter: '@?',
                noBorder: '@?',
                errItemId: '@?',
                writeBtnLog: '&',
                clearOthers: '=?' // 相関エラークリアコールバック関数
            },
            link: ($scope, el, attrs, ctrl) => {
                // リンクの内容を確定する
                if ($scope.link && $scope.linkText == undefined) {
                    $scope.linkText = 'くわしくはこちら';
                }
                // 変更あり、なし状態フラグ初期化する
                $scope.isInputShow === undefined && ($scope.isInputShow = '0');
                // 「変更する」ボタン名初期化する
                $scope.btnName = $scope.isInputShow !== '0' ? '変更取消' : '変更する';
                // 変更取消時、各入力項目初期化する（ディフォルト値セット）
                var getDefaultValue = (prep, defaultMap, defaultVal = undefined) => {
                    return defaultMap != undefined && defaultMap[prep] ? (angular.isObject(defaultMap[prep]) ? angular.copy(defaultMap[prep]) : defaultMap[prep]) : defaultVal;
                };
                // 「変更する」ボタンタップ時のイベント
                $scope.btnClick = ($event) => {
                    // ログ出力
                    $scope.writeBtnLog({ isInputShow: $scope.isInputShow, title: $scope.title });
                    // 変更あり、なし状態フラグを更新する
                    $scope.isInputShow == '0' ? ($scope.isInputShow = '1') : ($scope.isInputShow = '0');
                    // 「変更する」ボタン名更新する
                    $scope.btnName = $scope.isInputShow !== '0' ? '変更取消' : '変更する';
                    // '変更する'の場合
                    if ($scope.isInputShow == '0') {
                        if (angular.isArray($scope.data)) {
                            $scope.data = getDefaultValue(attrs.data, $scope.defaultMap, []);
                        }
                        else if (angular.isObject($scope.data)) {
                            Object.keys($scope.data).forEach(p => $scope.data[p] = getDefaultValue(p, $scope.defaultMap));
                        }
                        else {
                            $scope.data = $scope.defaultMap;
                        }
                        // クリアエラー
                        $(el).find('.err').removeClass('err');
                        $(el).find('.err-message').remove();
                        // 相関エラークリア
                        if (angular.isFunction($scope.clearOthers)) {
                            $scope.clearOthers();
                        }
                    }
                    // '変更取消'の場合
                    if ($scope.isInputShow == '1' && $scope.errItemId) {
                        // クリアエラー
                        $(el).find('.err').removeClass('err');
                        $(el).find('.err-message').remove();
                    }
                };
                // スクロールディレクティブのコントローラがあれば、行数を計算する
                if (ctrl) {
                    var number2 = el.find('row').length;
                    var number3 = el.find('row-description').length;
                    ctrl.addRows(number2 + number3);
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
                    };
                    // インデックス(「項目選択」ボタン)
                    $scope.navToggle = function () {
                        AppBizNaviScroll.navToggle();
                        if ($scope.isAfterInit) {
                            $timeout(() => AppBizNaviScroll.calculate($scope.navilist, 50), 0);
                        }
                    };
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
