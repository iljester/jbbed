<?php 
/**
 * jbbed php processor
 * Convert bbcode in html tags
 * @version 1.0
 */

 class jbbedDecode {
	
    /**
     * Default args
     */
	public $defaults = array(
        'tags' => 'b|i|u|link|img|hr|ol|ul|li|quote|code|size|color|font|vid|xpost',
        'tagAttrs'  => array(
            'size'  => 'span|style="font-size:$1"',
            'font'  => 'span|style="font-family:$1"',
            'color' => 'span|style="color:$1"',
            'link'  => 'a|href="$1"',
            'img'   => 'img|src="$1"',
			'quote' => 'blockquote*', // use asterisk for tag alias
			'code'	=> 'pre*'
        ),
        'filterAttrs' => array(
            'size'  => "[a-zA-Z0-9]+",
            'font'  => "[a-zA-Z0-9]+",
            'color' => "[a-fA-F0-9#]+",
            'img'   => "[^<>\s]+",
            'link'  => "[^<>\]\[\s]+"
        ),
        'video' => array(
            'youtube' => "560|315",
            'rumble' => "640|360",
        )
    );
    
    /**
     * String
     */
    public $string = '';

    /**
     * Args passed
     */
    public $args = [];

    /**
     * Replace tags
     */
    public $replace = false;

    /**
     * Remove selective tags
     */
    public $remove = '';

    /**
     * Youtube iframe
     */
    public static $youtube_iframe = '<iframe width="$1" height="$2" src="$3" title ="Youtube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>';
	
    /**
     * Rumlbe iframe
     */
    public static $rumble_iframe = '<iframe class="rumble" width="$1" height="$2" src="$3" frameborder="0" allowfullscreen></iframe>';
	
	/**
     * The constructor
     * 
     * @param string $string
     * @param array $args
     * @param bool $replace
     * @param string $remove
     */
	public function __construct( $string = '', $args = [], $replace = false, $remove = ''  ) {
		$this->string = $string;
		$this->args = $args;
		$this->replace = $replace;
		$this->remove = $remove;
		$this->_prepare();
	}

	/**
     * Parse arguments
     * @return void
     */
	protected function _prepare() {
	
	    $defaults = $this->defaults;
	    $replace = $this->replace;
	    $args = $this->args;
	
		$new_args = [];
	    foreach( $defaults as $param => $values ) {
	        switch( $param ) {
	            case 'tags' : 
	            	if( (bool) $replace === false ) {
	            		$new_args[$param] = isset( $args[$param] ) ? $values . '|' . $args[$param] : $values;
	            	} else {
	            		$new_args[$param] = $args[$param];
	            	}
	            	
	            break;
	            case 'video' :
	        		if(  isset( $args[$param]) && is_array( $args[$param])  ) {
	        			$new_args[$param] = array_merge( $values, $args[$param]);
	        		} else {
	        			$new_args[$param] = $values;
	        		}
	        		break;
	        	case 'tagsAttrs' || 'filterAttrs' :
	        		if(  isset( $args[$param]) && is_array( $args[$param])  ) {
	        			foreach( array_keys( $defaults[$param]) as $v ) {
		        			if( false !== array_key_exists( $v, $args[$param]) ) {
		        				unset( $args[$param][$v] );
		        			}
	        			}
	        			$new_args[$param] = array_merge( $values, $args[$param]);
	        		} else {
	        			$new_args[$param] = $values;
	        		}
	        	break;
	        	
	        }
	    }
	    
	    $this->args = $new_args;
	
	}
	
    /**
     * Remove illegal chars
     * @return void
     */
	protected function _clearString() {
		$string = $this->string;
		
		preg_match_all( '/\[(.*?)\]/', $string, $match );

		$n_match = [];
	
		foreach( $match[0] as $m ) {
			$m = preg_replace("/['\"<>\(\)\[\]\$!]/", '', $m);
			$n_match[] = '[' . $m . ']';
		}
	
		$n_string = str_replace( $match[0], $n_match, $string );
		
		// encode all special chars
		$n_string = htmlspecialchars($n_string, ENT_QUOTES, 'UTF-8');
		$this->string = $n_string;
	}
	
    /**
     * Selective remove tags
     * @return void
     */
	protected function _remove() {
		
		$removes = explode('|', $this->remove);
	    
	    if( ! empty( $removes ) ) {
	    	$e_args = explode( '|', $this->args['tags'] );
		    foreach( $e_args  as $k => $value ) {
		    	if( in_array( $value, $removes ) ) {
		    		unset( $e_args[$k]);
		    	}
		    }
		    $this->args['tags'] = implode('|', $e_args);
	    }
		
	}

    protected function _xpost( $url ) {
		$id = self::uniqidReal(6);
		$div = '<div id="' . $id . '"></div>';
		$div .= '<script>var url = "' . $url . '";var id  = "' . $id . '";jbbed.xpost( url, id );</script>';
		return $div;
	}
	
    /**
     * Get video
	 * 
	 * @param string $url // the url video
	 * @param string $k // loop key
	 * 
     * @return string
     */
	protected function _getVideo( $url, $k ) {

		$video = $this->args['video'];
		
		$parse_url = parse_url( $url );
		$host = str_replace( ['www.', '.com'], '', $parse_url['host'] );
		$vid = $k;
	
		switch( $host ) {
			case 'rumble' :
				$code = substr( $parse_url['path'], 7, -1 );
				$video_attrs = explode( '|', $video['rumble'] );
				$width = $video_attrs[0];
				$height = $video_attrs[1];
				$attrs = [];
				$attrs[] = $width;
				$attrs[] = $height;
				$attrs[] = "https://rumble.com/embed/{$code}/?pub=4";
				$iframe = str_replace( ['$1', '$2', '$3'], $attrs, self::$rumble_iframe );
				if( $code !== '' ) {
					$vid = $iframe;
				}
				break;
			case 'youtu.be' || 'youtube' || 'youtube-nocookie' : 
				$code = '';
				if( $host === 'youtu.be') {
					$code = substr( $parse_url['path'], 1 );
				} 
				elseif( $host === 'youtube') {
					if( !isset( $parse_url['query'] ) ) {
						break;
					}
					$query = $parse_url['query'];
					parse_str( $query, $output );
					if( !isset( $output['v'] ) ) {
						$code = substr( $parse_url['path'], 7 );
					} else {
						$code = $output['v'];
					}
				}
				$video_attrs = explode( '|', $video['youtube'] );
				$width = $video_attrs[0];
				$height = $video_attrs[1];
				$attrs = [];
				$attrs[] = $width;
				$attrs[] = $height;
				$attrs[] =  "https://www.youtube-nocookie.com/embed/{$code}?controls=1"; 
				$iframe = str_replace( ['$1', '$2', '$3'], $attrs, self::$youtube_iframe );
                
				if( $code !== '' ) {
					$vid = $iframe;
				}
				break;
		}
		
		return $vid;
	    
	}
	
    /**
     * Get html for tags
	 * 
	 * @param string $tagAttr // the html attributes
	 * @param string $value // value to pass
	 * 
     * @return array
     */
	protected function _getHtml( $tagAttr = '', $value = '' ) {
		
		if( stripos($tagAttr, '|') !== false ) {
			$a = explode('|', $tagAttr );
			$tag = $a[0];
			$attr = $a[1];
			$attr = str_replace( '$1', $value, $attr );
			$html = ['<' . $tag . ' ' . $attr . '>', '</' . $tag . '>'];
		} else {
			$tagAttr = trim( $tagAttr, '*');
			$html = ['<' . $tagAttr . '>', '</' . $tagAttr . '>'];
		}
		
		return $html;
		
	}
	
    /**
     * Convert bbtags to html
     * @return string
     */
	public function convert() {
		$this->_prepare();
		$this->_remove();
		$this->_clearString();
		
		$tags = explode( '|', $this->args['tags']);
		$string = $this->string;
		$tagAttrs = $this->args['tagAttrs'];
		
		foreach( $tags as $tag ) {
			
			if( isset( $tagAttrs[$tag] ) && 
				in_array( $tag, array_keys( $tagAttrs ) ) || 
				$tag === 'vid' || 
				$tag === 'xpost' ) 
			{
				$bbcode = '/\[' . $tag . '=(.*?)\]/';
				preg_match_all( $bbcode, $string, $match );
				$alias = false;
				if( ! isset( $match[0][0] ) && ! isset( $match[1][0]) ) {
					if( ! isset( $tagAttrs[$tag]) || stripos( $tagAttrs[$tag], '*') === false ) {
						continue;
					} else {
						$alias = true;
					}
				}
				$close = '[/' . $tag . ']';
				if( $tag === 'vid' ) {
					
					$bbcodes = $match[0];
					$urls = $match[1];
					
					foreach( $urls as $k => $url ) {
	
						$iframe = $this->_getVideo( $url, $bbcodes[$k] );
						$string = str_replace( $bbcodes[$k], $iframe, $string );
					}
					
				} 
                elseif( $tag === 'xpost') {
					$bbcode = $match[0][0];
					$url = $match[1][0];
					$post = $this->_xpost( $url );
					$string = str_replace( $bbcode, $post, $string );
				}
                else {
					$open = $alias === true ? '[' . $tag . ']' : $match[0][0];
					$value = $alias === true ? '' : $match[1][0];
					$html = $this->_getHtml($tagAttrs[$tag], $value );
					$string = str_replace( [$open, $close], $html, $string );
					
				}
			
			} else {
				$bbtag = ['[' . $tag . ']','[/' . $tag . ']'];
				$html = ['<' . $tag . '>', '</' . $tag . '>'];
				$string = str_replace($bbtag, $html, $string);
			}
			
		}

        // convert new lines
        $string = preg_replace('/\r\n|\r|\n/', '<br />', $string );
		
		// convert special char in his entity
		$string = html_entity_decode( $string );
		
		return $string;
		
	}

    /**
     * Generate unique id
     * @source: https://www.php.net/manual/en/function.uniqid.php#120123
	 * 
	 * @param int $length // chars to display for unique id
	 * @return string
     */
    static function uniqidReal($lenght = 13) {
        if (function_exists("random_bytes")) {
            $bytes = random_bytes(ceil($lenght / 2));
        } elseif (function_exists("openssl_random_pseudo_bytes")) {
            $bytes = openssl_random_pseudo_bytes(ceil($lenght / 2));
        } else {
            throw new Exception("no cryptographically secure random function available");
        }
        return substr(bin2hex($bytes), 0, $lenght);
    }
	
}

/**
 * Wrap to use convert class
 * 
 * @param string $string // string to convert
 * @param array $args // array of arguments to pass. See class
 * @param bool $replace // check if you want replace or not
 * @param string $remove // tags to remove
 * 
 * @param string $string string to pass to converte
 */
function jbbed_convert( $string = '', $args = [], $replace = false, $remove = ''  ) {
    $inst = new jbbedDecode( $string, $args, $replace, $remove  );
    return $inst->convert();
}
