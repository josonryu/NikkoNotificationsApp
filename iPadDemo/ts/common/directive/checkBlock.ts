App.directive('checkblock',['AppBizCom', (AppBizCom) => {
    return {
        restrict: 'E',
        templateUrl:'pages/common/directive/checkBlock.html',
        transclude: true,
        scope:{
            label: '@', // ラベル
            value: '@', // 選択時の入力値
            data: '=', // スコープ内該当項目の入力データ
            click: '&', // クリック時のイベント
            disabled: '=', // 非活性制御用フラグ
        },
        link: (scope, elem, attrs) => {
            
            // 値変更の時、エラーをクリアする
            scope.$watch('data', function(newVal, oldVal){
                return newVal !== oldVal && AppBizCom.Msg.clearError((<any>attrs).id);
            });
        }
    };
}]);