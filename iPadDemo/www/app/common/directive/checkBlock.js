App.directive('checkblock', ['AppBizCom', (AppBizCom) => {
        return {
            restrict: 'E',
            templateUrl: 'pages/common/directive/checkBlock.html',
            transclude: true,
            scope: {
                label: '@',
                value: '@',
                data: '=',
                click: '&',
                disabled: '=',
            },
            link: (scope, elem, attrs) => {
                // 値変更の時、エラーをクリアする
                scope.$watch('data', function (newVal, oldVal) {
                    return newVal !== oldVal && AppBizCom.Msg.clearError(attrs.id);
                });
            }
        };
    }]);
