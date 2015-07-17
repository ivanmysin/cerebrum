use PDL::NiceSlice;
##############################################################################

sub prediscr_plot_histogram {
my $x=shift;
my $xminimum=min($x);
$x=$x-$xminimum;
my $xmaximum=max($x);

@x=list($x);
my $y=shift;
my $yminimum=min($y);
$y=$y-$yminimum;
my $ymaximum=max($y);

@y=list($y);
my %opt=@{$_[0]};
shift;
my $idtx=30; # idtx is indent from right border
my $idty=30; # idtx is indent from top border
my $width_axes=$opt{'width'}-2*$idtx;
my $height_axes=$opt{'height'}-2*$idty;

@scale=split(" ",$opt{'scale'});
my $points="";
my $circles="";

for (my $i=0;$i<@x;$i++) {
	#$x[$i]/=;
	$x[$i]=$x[$i]*$width_axes/($scale[2]-$scale[0]) + $idtx; # + $scale[0]*$width_axes/($scale[2]-$scale[0]); #$x[$i]=$x[$i]*$width_axes/($scale[2]-$xmaximum) + $idtx; #
	$y[$i]=$height_axes - $y[$i]*$height_axes/($scale[3]-$scale[1])+$idty; #$y[$i]=$height_axes - $y[$i]*$height_axes/($scale[3]-$ymaximum)+$idty; #
	
	if ($opt{'line'} eq "true") {
		$points="$points $x[$i] $y[$i],";
	}
	if ($opt{'points'} eq "true") {
		$circles="$circles <circle cx=$x[$i] cy=$y[$i] r=\"3px\" fill=\"red\" style=\"fill-opacity: 0.5\" /> \n\t";
	}
}
chop($points);

my $gridx=$width_axes/$opt{'ngridsx'};
my $gridy=$height_axes/$opt{'ngridsy'};

my $yshift=$opt{'height'}-$idty;
my $xcoordgrid=$yshift-7;
my $ycoordgrid=$idty+7;
my $gridx_svg="<path d=\"";
my $gridy_svg="<path d=\"";
my $newx=$idtx;
my $newy=$yshift;

my $xnotes="";
my $ynotes="";

my $ycoord_of_notes_x=$yshift+12;
my $xcoord_of_notes_y=$idtx-20;
for (my $i=0;$i<=$opt{'ngridsx'}; $i++){
	$gridx_svg="$gridx_svg M $newx $yshift V $xcoordgrid";
	my $xnotecoord=($newx-$idtx)*($scale[2]-$scale[0])/$width_axes + $xminimum;
	my $xcoord_of_notes_x=$newx-3;
	$xnotes="$xnotes <text x=\"$xcoord_of_notes_x\" y=\"$ycoord_of_notes_x\" stroke=\"none\" fill=\"0.5\" font-weight=\"bolder\" font-family=\"Arial\" font-size=\"10px\"><tspan>$xnotecoord</tspan></text> \n\t";
	$newx+=$gridx;
}
$gridx_svg="$gridx_svg \" stroke=\"black\" stroke-width=\"1\"/>";

for (my $i=0; $i<=$opt{'ngridsy'}; $i++) {
	$gridy_svg="$gridy_svg M $idtx $newy H $ycoordgrid";
	my $ynotecoord=($yshift-$newy)*($scale[3]-$scale[1])/$height_axes + $yminimum;
	my $ycoord_of_notes_y=$newy+3;
	$ynotes="$ynotes <text x=\"$xcoord_of_notes_y\" y=\"$ycoord_of_notes_y\" stroke=\"none\" fill=\"0.5\" font-weight=\"bolder\" font-family=\"Arial\" font-size=\"10px\"><tspan>$ynotecoord</tspan></text> \n\t";
	$newy-=$gridy;
}
$gridy_svg="$gridy_svg  \" stroke=\"black\" stroke-width=\"1\"/>";
my $low_y_axes=$height_axes+$idty;
my $x_of_title=$opt{'width'}*0.35;
my $x_of_titlex=$opt{'width'}-90;
my $y_of_titlex=$opt{'height'}-5;

my $line="";
for (my $i=0; $i<$opt{'nlines'}; $i++) {
	my $rand_x=rand($width_axes)+$idtx;
	$line="${line}<line x1=$rand_x y1=$idty x2=$rand_x y2=$low_y_axes style=\"stroke: red; stroke-width: 1; fill: none;\" /> \n";
}

my $svg=
"<svg id=$opt{'svg_id'} width=\"$opt{'width'}px\" height=\"$opt{'height'}px\" style=\"background: #FFDAB9\" preserveAspectRatio=\"xMinYMin slice\" onclick=\"$opt{'js_function'}\">
	<text x=\"$x_of_title\" y=\"20\" stroke=\"none\" fill=\"0.5\" font-weight=\"bolder\" font-family=\"Arial\" font-size=\"14px\"><tspan>$opt{title}</tspan></text>
	<rect x=\"$idtx\" y=\"$idty\" width=\"$width_axes\" height=\"$height_axes\" style=\"fill: none; stroke: black; stroke-width: 1 \"/>
	<polyline transform=\"scale(1,1)\" points=\"$points\" style=\"stroke: black; stroke-width: 1; fill: none;\" />
	$circles
	$gridx_svg
	$gridy_svg
	$xnotes
	$ynotes
	<text x=\"$x_of_titlex\" y=\"$y_of_titlex\" stroke=\"none\" fill=\"0.5\" font-weight=\"bolder\" font-family=\"Arial\" font-size=\"10px\"><tspan>$opt{title_x}</tspan></text>
	<text x=\"5\" y=\"20\" stroke=\"none\" fill=\"0.5\" font-weight=\"bolder\" font-family=\"Arial\" font-size=\"10px\"><tspan>$opt{title_y}</tspan></text>
	$line
</svg>\n";
return $svg;
}


##################################################
sub gmi {
my $sp=shift; # sp is coordinats of spike in select interval
my $bin=shift; #bin in milisecond for histogram
my $maxx=shift; # $maxx is maximum value in histogram
my $maxy=shift; # $maxy is maximum value in histogram
my $order=shift; # $order is the order of intervals
my $nb=shift;
$nb++;
#$sp=double($sp);
my $mi=$sp($order:-1)-$sp(0:-$order-1); # $mi is piddle of interspikes intervals
my $kv=sprintf("%0.2f", sqrt(var_unbiased($mi))/avg($mi));# $kv is kofficient of variance of intervals
my $gmi=histogram($mi, $bin, 0, int($maxx/$bin)+1);
$gmi=double($gmi);
$gmi/=nelem($mi); 
my $x=sequence(int($maxx/$bin)+1);
$x*=$bin;
my $gmi_plot=&svg_plot($x,$gmi);
return ($kv,$gmi_plot);
}
###################################################################################

sub acg {
use PDL::Stats::GLM;
my $sp=shift; # sp is coordinats of spike in select interval
my $bin=shift;  # bin in milisecond for histogram
my $length=shift; # length of autocorrelelogram
my $norm=shift;   # parametr normalization
my $nb=shift;
$nb++;
my $ne=nelem($sp);
my $nbins=int($length/$bin)+1;
my $aut; # aut is data for autocorrelelogram
for (my $i=0; $i<($ne-1); $i++) {
	my $int=$sp($i+1:-1)-$sp(0:-$i-2);
	my $at=histogram($int, $bin, 0, $nbins);
	$at=double($at);
	$at/=nelem($int); 
	$aut+=$at;
	}
if ($norm eq 'spikes') {
	$aut/=$ne
	}
if ($norm eq 'length') {
	$aut/=($sp(-1)-$sp(0))
	}
my $x=sequence(nelem($aut)-1);
$x*=$bin;
$aut=$aut(0:-2);
my $acg_plot=&svg_plot($x,$aut);

my $ind_max;
my $ind_min;

($ind_max,$ind_min)=&extremums($aut);
my $maxtau=log($aut($ind_max));
my $mintau=log($aut($ind_min));

=g
my %reg=$maxtau->ols($x($ind_max));
$maxtau=$reg{'b'};
$maxtau=-$maxtau(0);
%reg=$mintau->ols($x($ind_min));
$mintau=$reg{'b'};
$mintau=-$mintau(0);
=cut

return ($aut, $maxtau,$mintau,$acg_plot);
}
##################################################################################################

sub acg_spectr {
my $sp=shift;
my $length=shift;
my $fd=shift;
my $bin=1/$fd;
my $nb=shift;
$nb++;

my $ne=nelem($sp);
my $nbins=2*int($length/$fd)+1;
my $aut; # aut is data for autocorrelelogram
for (my $i=0; $i<($ne-1); $i++) {
	my $int=$sp($i+1:-1)-$sp(0:-$i-2);
	my $at=histogram($int, $bin, 0, $nbins);
	$at=double($at);
	$at/=nelem($int); 
	$aut+=$at;
	}
$aut=$aut(0:-2);
(my $x, my $spectr)=&furie_spectr($fd,$aut);
$x=$x(1:-1);
$spectr=$spectr(1:-1);
my $spectr_plot=&svg_plot($x, $spectr);
my $maxspectr=which($spectr==max($spectr));
$maxspectr=$x($maxspectr);
return ($maxspectr,$spectr_plot);
}
################################################################
sub find_spikes_properties {
my $loc_max_ind=shift;
my $loc_min_ind=shift;
my $loc_max=shift;
my $loc_min=shift;
my $spikes=shift;
my $pdl=shift;
my $param=shift;
my $sp_ind;

while ($loc_min_ind(0)<$loc_max_ind(0)) {
	$loc_min_ind=$loc_min_ind(1:-1);
	}
my $nmax=nelem($loc_max_ind);	
my $nmin=nelem($loc_min_ind);
my $t=$nmax-$nmin;

if ($t!=0) {
	for (my $i=0; $i<$t; $i++) {
		$loc_max_ind=$loc_max_ind(0:-2);
		}
	} else {
	for (my $i=0; $i<abs($t); $i++) {
		$loc_min_ind=$loc_min_ind(0:-2);
		}
	}
	
my $th;
if ($param eq 'top' or $param eq 'amp') {
	my $r=$pdl($spikes)->clump(-1);
	$th=min($r);
	my $t=$loc_max; 
	$t=$t->sever;
	my $p1=which($t<$th);
	my $p2=which($t>=$th);
	$t($p1).=0;
	$t($p2).=1;
	$sp_ind=which($t==1);
	$sp_ind--;
} else {
	my $r=$pdl($spikes)->clump(-1);
	$th=max($r);
	my $t=$loc_min; 
	$t=$t->sever;
	my $p1=which($t>$th);
	my $p2=which($t<=$th);
	$t($p1).=0;
	$t($p2).=1;
	$sp_ind=which($t==1);
} 
#print $sp_ind->where($sp_ind<0);
my $indx=zeros(nelem($sp_ind),5);
$indx(,0).=$loc_max_ind($sp_ind);
$indx(,1).=$loc_min_ind($sp_ind);
$sp_ind++;
$indx(,3).=$loc_max_ind($sp_ind);
$indx(,4).=$loc_min_ind($sp_ind);
$indx=$indx->transpose();

my $inter_points_ind=zeroes(1,nelem($sp_ind));

# =h
#for (my $i=0;$i<nelem($sp_ind);$i++) {
	$normpdl=$pdl-avg($pdl);
	$inter_points_ind(0,$i).=minimum_ind(abs($normpdl($indx(1,$i):$indx(3,$i))));
#}
$inter_points_ind+=$indx(1,);
$indx(2,).=$inter_points_ind;
my $val=$pdl($indx);

my $spikes_properties=zeroes(8,nelem($sp_ind));
$spikes_properties(0,).= ($val(1,)-$val(0,))/($indx(1,)-$indx(0,)+1); # negative gradient
$spikes_properties(1,).= ($val(3,)-$val(1,))/($indx(3,)-$indx(1,)+1); # positive gradient
$spikes_properties(2,).= $val(3,)-$val(1,); # absolute amplitude
$spikes_properties(3,).= $indx(2,)-$indx(0,)+1; # median length of spikes
$spikes_properties(4,).= $indx(-1,)-$indx(0,)+1; # absolute length of spikes
$spikes_properties(5,).= $indx(-1,)-$indx(-2,)+1; # time of decreasing potential to rest
$spikes_properties(6,).= $val(3,); # positive peack amplitude
$spikes_properties(7,).= $val(1,); # negative peack amplitude
return ($spikes_properties);
#=cut
#my $spikes_properties=zeroes(8,nelem($sp_ind));
}
