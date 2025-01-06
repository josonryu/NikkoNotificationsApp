App.directive('radioblock',['AppBizCom', (AppBizCom) => {
    return {
        restrict: 'E',
        templateUrl:'pages/common/directive/radioBlock.html',
        transclude: true,
        scope:{
            value: '@', // 選択値
            data: '=', // スコープ内該当項目の入力データ
            click: '&', // クリック時のイベント
            list: '=', // 該当項目のマスタデータ
            optionvalue: '@',
        },
        link: (scope, elem, attrs) => {

            // 値変更の時、エラーをクリアする
            scope.$watch('data', function(newVal, oldVal){
                return newVal !== oldVal && AppBizCom.Msg.clearError((<any>attrs).id);
            });
        }
    };
}]);