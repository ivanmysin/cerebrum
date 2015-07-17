#!/usr/bin/python
# -*- coding: utf-8 -*-
import cgi, os

# анализ запроса
f = cgi.FieldStorage()
if f.has_key("a"):
  a = f["a"].value
else:
  a = "0"

# обработка запроса
b = str(int(a)+1)
mytext = open(os.environ["SCRIPT_FILENAME"]).read()
mytext_html = cgi.escape(mytext)

# формированиве ответа
print "Content-Type: text/html charset=utf-8\n\n"
print """
<html>
<head>
	<title>Решение примера: %(b)s = %(a)s + 1</title>
	<meta http-equiv="content-type" content="text/html; charset=utf-8" />
</head>
<body>
%(b)s
	<table width="80%%">
		<tr>
			<td>
				<form method="POST">
					<input type="text" name="a" value="0" size="6">
					<input type="submit" name="b" value="Обработать">
				</form>
			</td>
		</tr>
	</table>
	<pre>
		%(mytext_html)s
	</pre>
</body>
</html>""" % vars()

