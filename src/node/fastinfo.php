<?php 
/*
	by Jude <surftheair@gmail.com>
	http://jude.im/
	works with Icecast 2.3.2
*/
define('M1',$_SERVER['argv'][1]);
define('M2',$_SERVER['argv'][2]);

define('SERVER', 'localhost:8000');//your icecast server address, without the ending "/"

$stream = getStreamInfo();
echo($stream);

function getpage($url, $connect_timeout=10, $timeout=120)
{
        $ch = curl_init();
        curl_setopt($ch,CURLOPT_URL,$url);
        curl_setopt($ch,CURLOPT_RETURNTRANSFER,1);
        curl_setopt($ch,CURLOPT_TIMEOUT, $timeout);
        curl_setopt($ch, CURLOPT_USERPWD, "admin:iloveukupnik");
        curl_setopt($ch,CURLOPT_CONNECTTIMEOUT, $connect_timeout);
        $data = curl_exec($ch);
        curl_close($ch);
        return $data;
}


function getStreamInfo(){
	$str = getpage(SERVER.'/admin/listclients.xsl?mount=/'.M1);
	$ips='';
	if(preg_match_all('/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/isU', $str, $match1)){
		foreach ($match1[0] as $key=>$value) {
			$ips=$ips.$value.',';
		}
	}

	
	$str2 = getpage(SERVER.'/admin/listclients.xsl?mount=/'.M2);
	
	if(preg_match_all('/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/isU', $str2, $match2)){	
		foreach ($match2[0] as $key=>$value) {
			$ips=$ips.$value.',';
		}
	}
	return $ips;
}

?>