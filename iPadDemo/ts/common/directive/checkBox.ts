App.directive('checkbox',['AppBizCom', (AppBizCom)  => {
    return {
        restrict: 'E',
        templateUrl:'pages/common/directive/checkBox.html',
        scope:{
            label: '@', // ラベル
            value: '@', // 選択時の入力値
            falseValue: '@', // 未選択時の入力値
            data: '=', // スコープ内該当項目の入力データ
            click: '&', // クリック時のイベント
            disabled: '=', // 非活性制御用フラグ
            hint: '@', // 補足情報
            clearId: '@?' // エラー項目がチェックボックス自体ではない場合、指定されたエラー項目id
        },
        link: (scope, elem, attrs) => {
            // 値変更の時、エラーをクリアする
            scope.$watch('data', function(newVal, oldVal){
                var tmpId = (<any>attrs).clearId || (<any>attrs).id;
                return newVal !== oldVal && AppBizCom.Msg.clearError(tmpId);
            });
        }
    };
}]);

App.filter('chgLine', ['$sce', function($sce){
    return function(data){
        var html = ''
        html = (angular.isString(data) && data.replace(/\|/g, '<br />'));
        return $sce.trustAsHtml(html);
    }
}]);