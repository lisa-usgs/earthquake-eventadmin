<?php

if (!isset($TEMPLATE)) {
  include_once 'functions.inc.php';
  include_once '../conf/config.inc.php';

  $eventid = param('eventid');
  if ($eventid === null || $eventid === '') {
    header('Location: ./');
    exit();
  }

  if (isset($CONFIG['OFFSITE_HOST']) && $CONFIG['OFFSITE_HOST'] != '') {
    $OFFSITE_HOST = 'http://' . $CONFIG['OFFSITE_HOST'];
  } else {
    $OFFSITE_HOST = 'http://' . $_SERVER['HTTP_HOST'];
  }

  $STUB = $OFFSITE_HOST . $CONFIG['DETAILS_STUB'];

    $ch = curl_init(sprintf($STUB, $eventid));
    curl_setopt_array($ch, array(
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_RETURNTRANSFER => true));
    $EVENT_FEED = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

    if ($httpCode !== 200) {
      // cache "error" for 1 minute
      $now = time();
      $maxAge = 60;
      header('Cache-Control: max-age=' . $maxAge);
      header('Expires: ' . gmdate('D, d M Y H:i:s \G\M\T', $now + $maxAge));
      header('Last-Modified: ' . gmdate('D, d M Y H:i:s \G\M\T', $now));

      if ($httpCode === 404 || $httpCode === 204) {
        // event not found
        header('HTTP/1.0 404 Not Found');
      } else if ($httpCode === 409) {
        header('HTTP/1.0 410 Gone');
        $TITLE = 'Event Deleted';
        include_once 'template.inc.php';
      } else {
        // other, unexpected return
        header('HTTP/1.0 503 Service Unavailable');
        echo 'Unable to retrieve event information (' . $httpCode . ')';
      }
      exit(-1);
    }

    $replaceWith = 'url":"';
    $searchFor = $replaceWith . $OFFSITE_HOST;

    $EVENT = json_decode(str_replace(
        $searchFor, $replaceWith, $EVENT_FEED), true);

    $PROPERTIES = $EVENT['properties'];
    $GEOMETRY = $EVENT['geometry'];

    if ($PROPERTIES['net'] . $PROPERTIES['code'] !== $eventid) {
      header('HTTP/1.1 301 Moved Permanently');
      header('Location: ' . $PROPERTIES['url']);
    }

    $TITLE = $PROPERTIES['title'];
    $NAVIGATION = navItem('#', 'Event Summary');

    $EVENT_CONFIG = array(
      'MOUNT_PATH' => $CONFIG['MOUNT_PATH'],
      'KML_STUB' => isset($CONFIG['KML_STUB']) ? $CONFIG['KML_STUB'] : null,
      'DYFI_RESPONSE_URL' => $CONFIG['DYFI_RESPONSE_URL']
    );

    $HEAD = '<link rel="stylesheet" href="css/event.css"/>';
    $FOOT =
      /* create event page with event details and config. */
      '<script>' .
        'var EventConfig = ' . json_encode($EVENT_CONFIG) . ';' .
        'var EventDetails = ' . json_encode($EVENT) . ';' .
      '</script>' .
      /* this script creates EventPage using EventConfig, EventDetails */
      '<script src="js/event.js"></script>';

  include 'template.inc.php';
}

if ($httpCode != 409) {
  include_once '../lib/inc/html.inc.php';
} else {
  print '<p class="alert error">The requested event has been deleted.</p>';
}
?>
