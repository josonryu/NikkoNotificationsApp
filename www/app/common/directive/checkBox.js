App.directive('checkbox', ['AppBizCom', (AppBizCom) => {
        return {
            restrict: 'E',
            templateUrl: 'pages/common/directive/checkBox.html',
            scope: {
                label: '@',
                value: '@',
                falseValue: '@',
                data: '=',
                click: '&',
                disabled: '=',
                hint: '@',
                clearId: '@?' // エラー項目がチェックボックス自体ではない場合、指定されたエラー項目id
            },
            link: (scope, elem, attrs) => {
                // 値変更の時、エラーをクリアする
                scope.$watch('data', function (newVal, oldVal) {
                    var tmpId = attrs.clearId || attrs.id;
                    return newVal !== oldVal && AppBizCom.Msg.clearError(tmpId);
                });
            }
        };
    }]);
App.filter('chgLine', ['$sce', function ($sce) {
        return function (data) {
            var html = '';
            html = (angular.isString(data) && data.replace(/\|/g, '<br />'));
            return $sce.trustAsHtml(html);
        };
    }]);
