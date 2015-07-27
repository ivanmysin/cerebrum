#!/usr/bin/perl -w

=h
	open(LOG, ">","/home/ivan/mysites/cerebrum.loc/log.txt");
	print LOG $query;
	close LOG;
=cut

print "Content-Type: text/html charset=utf-8\n\n";
print qq(
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
</html>);
