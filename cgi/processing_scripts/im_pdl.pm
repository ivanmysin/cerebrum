use PDL::Lite;
use PDL::NiceSlice;
use JSON;

########################################################################
sub cut_shift { # sub cut_shift cuts data from pidlls between two bounds and shifts data, which more than high bound for difference between high and low bounds. Pidlle must be sorted by increasing and contained only positive values!  
	my $lb=shift; # lb is low bound
	my $hb=shift; # hb is high bound
	my $pdl=shift; # pdl is data pidlle
	my $p=$pdl->where($pdl>$lb);
	$p=$p->where($p<$hb);
	$p*=(-1);
	$pdl=$pdl->where($pdl>0);
	$p=$pdl->where($pdl>$hb);
	$p-=($hb-$lb);
	return $pdl;
}
########################################################################

sub find_marks {
	my $fd=shift;
	my $pdl=shift; #pdl is external data
	my $time=2; # $time is long of marks
	my $sl=$fd*$time; # sl is number values = 0, which are mark
	my $indz=which($pdl==0);
	my $dif=$indz(1:-1)-$indz(0:-2);
	$dif=which($dif==1);
	$dif=$indz($dif);
	my $p=zeroes($pdl);
	$p($dif).=1;
	my $df=$p(1:-1)-$p(0:-2);
	my $lb=which($df>0);
	$lb++;
	my $hb=which($df<0);
	$hb++;
	$p=$hb-$lb;
	$lb=$lb(which($p>$sl));
	$hb=$hb(which($p>$sl));
	return ($lb, $hb);
}
########################################################################

sub cut_slice {
my $li=shift;
my $hi=shift;
my $pdl=shift;
my $i=nelem($pdl);
$i--;
my $ind=sequence($i);
$ind($li:$hi).=(-1);
$ind=$ind->where($ind>=0);
$pdl=$pdl($ind);
return $pdl;
}
########################################################################

sub extremums {   # sub ext return indexes of extremums of function
	my $pdl=shift;
	my $dif=$pdl(1:-1)-$pdl(0:-2);
	my $t=$dif->where($dif<0);
	$t.=(-2);
	my $r=$dif->where($dif>0);
	$r.=2;
	my $k=$dif->where($dif==0);
	$k.=1;
	my $lm=$dif(0:-2)*$dif(1:-1);
	my $ext_ind=which($lm<0);
	$ext_ind++;
	my $ext=zeroes($dif);
	$ext($ext_ind).=$dif($ext_ind);
	my $lmax_ind=which($ext<0);
	my $lmin_ind=which($ext>0);
	return ($lmax_ind, $lmin_ind);
}
########################################################################

sub furie_spectr {
use PDL::FFT;
my $fd=shift; # fd is friquncy of discritization
$fd=1/$fd;
#my $d=1;
my $r=shift; # $r is external data
my $i=zeroes($r);
my $n=nelem($r);
my $kx;
fft($r,$i);
my $a=sqrt($r**2+$i**2)*2/$n;
if (&even($n)) {
	$kx = $r->xlinvals(-($n/2-1)/$n/$fd,1/2/$fd)->rotate(-($n/2 -1));
	} else {
	$kx = $r->xlinvals(-($n/2-0.5)/$n/$fd,($n/2-0.5)/$n/$fd)->rotate(-($n-1)/2);
	}
$a=$a(0:$n/2);
$a(0)/=2;
$kx=$kx(0:$n/2);
return ($kx, $a);
}
########################################################################

sub p_pdl {
my $pdl=shift;
my $n=nelem($pdl);
for (my $i=0; $i<$n; $i++) {
  print $pdl($i),"\n";
  }
}
########################################################################
sub f_sers {
my $stims=shift;
my $st=zeroes(nelem($stims)+2);
$st(0).=$stims(0)-(($stims(1)-$stims(0))*20);
$st(-1).=$stims(-1)+(($stims(-1)-$stims(-2))*20);
$st(1:-2).=$stims;
my $msi=$st(1:-1)-$st(0:-2); #msi - array of interstim intervals
my $rel=$msi(1:-1)/$msi(0:-2);
my $hint=which($rel>1.5);
my $lint=which($rel<0.67);
my $dhint=$hint(1:-1)-$hint(0:-2);
my $t=which($dhint<4);
$hint($t).=(-1);
$hint=$hint->where($hint>=0);
my $dlint=$lint(1:-1)-$lint(0:-2);
$t=which($dlint<3);
$lint($t).=(-1);
$lint=$lint->where($lint>=0);
my $n=nelem($hint);
for (my $i=0; $i<$n; $i++) {
#print nelem($stims),"<p></p>";
	$sers[$i]=$stims($lint($i):$hint($i))
	}
return @sers;   
}
########################################################################


########################################################################

sub burst {
use PDL::Stats::Kmeans;
my $sp=shift;
my $aut_param=shift;
my $int=$sp(1:-1)-$sp(0:-2);
my $burst;
my $minsp;
my $hb=$sp(-1);
my $lb=$sp(0); 
if ($aut_param eq 'on') {     
  my %clus=$int->kmeans({NCLUS=>2});
  my $inds=qsorti($clus{centroid});
  $burst=$clus{cluster};
  $burst=$burst(,$inds(0));
  $burst=$burst->clump(2);
  shift;
  $minsp=shift; # !!!! нужно написать определение максимального колличества спайков в пачке
} else {
  my $max_interspike_gap=shift;
  $minsp=shift;
  my $min_nums_sp_burst=shift;
  my $r=$int->where($int>$max_interspike_gap); # this code is nessecery for removal in intermidiate values
  $r=$r->where($r<$min_interburst_gap);        #
  $r.=4;                                       #
  my $t=which($int<=$max_interspike_gap);  # burst_intervals is interburst intervals
  $int($t).=1;
  $t=which($int>=$min_interburst_gap);
  $int($t).=0;
  $burst=byte($int);
}
my $d=$burst(1:-1)-$burst(0:-2);
my $fs=which($d==1);  # st is piddle indexes of fist spikes in each burst
my $ls=which($d==255); # ls is piddle indexes of last spikes in each burst
my $p=$ls-$fs;
$p=which($p>$minsp);
$fs=$fs($p);
$ls=$ls($p);
$fs++;
$ls++;
my $nburst=nelem($fs); # $nburst is numbers of bursts in sample
my $frb=$nburst/($hb-$lb); # $frb is mean frequency of bursts
my $mnsp=$ls-$fs; # $mnsp is mean numbers spikes in burst
$mnsp++;
$mnsp=avg($mnsp);
my $mlburst=$sp($ls)-$sp($fs); # $mlburst is mean leng of burst
$mlburst=avg($mlburst);
my $mfrburst=$mnsp/$mlburst;  # mfrburs is mean friquency in burst
my $mintburst=avg($sp($fs(1:-1))-$sp($ls(0:-2))); # $mintburst is mean interburst interval
return ($nburst,$frb,$mnsp,$mlburst,$mfrburst,$mintburst);
}
########################################################################

sub find_hist {
my $pdl=shift;
my $bin=((max($pdl)-min($pdl))*0.1)/nelem($pdl);
my $x=sequence(10*nelem($pdl)+1);
$x*=$bin;
my $hist=histogram($pdl,$bin,int(min($pdl)),nelem($x));
$hist=double($hist);
$hist/=nelem($pdl);
return ($x,$hist);
}
########################################################################

sub find_amp {
my $lmax_ind=shift;
my $lmin_ind=shift;
my $pdl=shift;  # pdl is external data
while ($lmin_ind(0)>$lmax_ind(0)) {
	$lmax_ind=$lmax_ind(1:-1);
	}
my $nmax=nelem($lmax_ind);	
my $nmin=nelem($lmin_ind);
my $t=$nmax-$nmin;
if ($t>0) {
	for (my $i=0; $i<$t; $i++) {
		$lmax_ind=$lmax_ind(0:-2);
		}
	} else {
	for (my $i=0; $i<abs($t); $i++) {
		$lmin_ind=$lmin_ind(0:-2);
		}
	}
my $amps=$pdl($lmax_ind)-$pdl($lmin_ind);
return ($amps,$lmax_ind);
}
########################################################################
sub cutstims {
use PDL::Stats::Basic;
my $stims=shift;
my $msi=$stims(1:-1)-$stims(0:-2); #msi - array of interstim intervals
my $n=nelem($stims);
my $z=0;
my $j;
my $st; #=pdl;
my @sers=(); # array of array, which contains coordinats of series stimulation
for (my $i=0; $i<($n-1); $i++) {
	my $kof=0;
		for ($j=1; ($kof<1) and ($j<($n-$i-1)); $j++) {
		$kof=ss($msi($i:$i+$j));
		}
	$st=$stims($i:($i+$j-1));
	$sers[$z]=$st;
	$z++;
	$i=$i+$j-1;
	if (nelem($st)<6) {
		$z--
		}
	}
return @sers;
}
########################################################################
sub f_sers2 {
my $stims=shift;
my $dstims=$stims(1:-1)-$stims(0:-2);
my $t=which($dstims>3);
$t++;
my @sers;
$sers[0]=$stims(0:$t(0));
my $j=1;
for (my $i=1; $i<nelem($t); $i++) {
	my $r=$stims($t($i-1):$t($i));
	if (nelem($r)>3) {
		$sers[$j]=$r;
		$j++;
		}
	}
return @sers;
}
########################################################################
# Функция сохраняет параметры, обрабатывающиеся на стороне сервера
sub save_param {
	my $node_id = shift;
	my $param_ref = shift;
	
	my $param = (JSON->new->utf8->encode($param_ref));
	my $query = "UPDATE processing_nodes SET server_json_params='$param' WHERE id=$node_id";
	
	my $sth = $dbh->prepare($query);
	my $res = $sth->execute();
	$sth->finish();
	return $res;
}

sub cut_end_qouts {
	my $str = shift;
	
	if (substr($str, 0, 1) eq "\"" or substr($str, 0, 1) eq "'") {
		$str = substr($str, 1);
	};

	if (substr($str, -1, 1) eq "\"" or substr($str, -1, 1) eq "'") {
		$str = substr($str, 0, -1);
	};
	return $str;
}
########################################################################


########################################################################
1;
