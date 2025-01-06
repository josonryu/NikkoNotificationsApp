App.directive('dataurl', [function () {
        return {
            restrict: 'A',
            compile: function () {
                return {
                    post: function (scope, iElement, iAttrs) {
                        var imgPat = cordova.file.dataDirectory + iAttrs['dataurl'];
                        window.resolveLocalFileSystemURL(imgPat, function (fileEntry) {
                            fileEntry.file(function (file) {
                                var reader = new FileReader();
                                reader.onloadend = function () {
                                    iElement.attr('src', reader.result);
                                    scope.$applyAsync();
                                };
                                reader.readAsDataURL(file);
                            });
                        });
                    }
                };
            }
        };
    }]);
