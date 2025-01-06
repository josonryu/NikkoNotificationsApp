App.directive('radio', ['AppBizCom', '$timeout', (AppBizCom, $timeout) => {
        return {
            restrict: 'E',
            templateUrl: 'pages/common/directive/radio.html',
            scope: {
                list: '=',
                name: '@?',
                data: '=',
                disabled: '=?',
                click: '&?',
                change: '&?' // 選択変更時のイベント
            },
            link: (scope, elem, attrs) => {
                if (!attrs.disabled) {
                    attrs.disabled = 'false';
                }
                ;
                // 値変更の時、エラーをクリアする
                scope.$watch('data', function (newVal, oldVal) {
                    return newVal !== oldVal && AppBizCom.Msg.clearError(attrs.id);
                });
                scope.radioChg = function () {
                    angular.isFunction(scope.change) &&
                        $timeout(function () { scope.change({ value: scope.data }); });
                };
                scope.radioClick = function ($event) {
                    angular.isFunction(scope.click) &&
                        $timeout(function () { scope.click({ $event: $event, value: scope.data }); });
                };
            }
        };
    }]);
