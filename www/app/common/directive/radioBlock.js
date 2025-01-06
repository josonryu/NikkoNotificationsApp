App.directive('radioblock', ['AppBizCom', (AppBizCom) => {
        return {
            restrict: 'E',
            templateUrl: 'pages/common/directive/radioBlock.html',
            transclude: true,
            scope: {
                value: '@',
                data: '=',
                click: '&',
                list: '=',
                optionvalue: '@',
            },
            link: (scope, elem, attrs) => {
                // 値変更の時、エラーをクリアする
                scope.$watch('data', function (newVal, oldVal) {
                    return newVal !== oldVal && AppBizCom.Msg.clearError(attrs.id);
                });
            }
        };
    }]);
