App.directive('row', ['$timeout', ($timeout) => {
        return {
            restrict: 'E',
            templateUrl: 'pages/common/directive/blockRow.html',
            require: '?^^scroll',
            transclude: {
                'title': '?rowTitle',
                'info': '?rowInfo',
            },
            scope: {
                title: '@?',
                info: '@?',
            },
            link: ($scope, el, attrs, ctrl) => {
                if ('required' in attrs && attrs.required == '') {
                    $scope.alwaysHasMark = true;
                }
                $scope.$watch('isRequired', (val) => {
                    $scope.hasMark = !!val;
                });
                if (ctrl) {
                    $timeout(() => {
                        ctrl.addReadyRows(1);
                    });
                }
            },
        };
    }]);
