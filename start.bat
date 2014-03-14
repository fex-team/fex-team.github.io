:: by niuyao, start fex bolg, you can use : start.bat your_jekyll_home

@echo off

IF "%JEKYLL_HOME%" equ "" (
	:: add jelly to env path and start fex blog...'
	IF "%1"=="" (
		echo 'please use as : start.bat your_jekyll_home !'
		goto:eof
	)
	goto:set_path_and_start_blog
) ELSE (
	:: 'try to start fex blog...'
	goto:start_fex_blog
)

:set_path_and_start_blog
echo 'set jekyll env...'
SET JEKYLL_HOME=%1
SET PATH=%PATH%;%JEKYLL_HOME%\ruby\bin;%JEKYLL_HOME%\devkit\bin;%JEKYLL_HOME%\git\bin;%JEKYLL_HOME%\Python\App;%JEKYLL_HOME%\devkit\mingw\bin;%JEKYLL_HOME%\curl\bin
goto:start_fex_blog

:start_fex_blog
echo 'start fex blog...'
:: echo jekyll home : %JEKYLL_HOME%
:: echo path : %PATH%
@echo on
jekyll serve --watch --drafts
pause


