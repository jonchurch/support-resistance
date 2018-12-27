var _ = require('underscore');
var n = require('numbro');
var request = require('request');

//n.BigNumber.config({ ERRORS: false });

/**

	Floor Pivot Support / Resistance
	--------------------------------



	**/


//

var isUndef = function (obj) {
    return typeof obj == "undefined";
  }

var reverseAppend = function (refList, addList, field) {
    if (isUndef(field))
      throw new Error ("Unable to append values, no field given")
    addList.forEach (function (add, i) {
      refList[(refList.length)-(addList.length)+i][field] = add[field] ? add[field] : add;
    })
    return refList;
  }
/**
 * Returns the Floor pivot level, three support levels (s1,s2 and s3)
 * and three resistance levels (r1, r2 and r3) of the
 * given data series.
 * These values for a given day are calculated based on the day before
 * so expect n values as output for a given list of n days.
 * Note that all three must have the same length.
 * Params: - higList: list of high values
 *         - lowList: list of low values
 *         - cliseList: list of closing values
 * The result is a list of elements with fields:
 *         - r3: resistence third level
 *         - r2: resistance second level
 *         - r1: resistance first level
 *         - pl: pivot level
 *         - s3: support third level
 *         - s2: support second level
 *         - s1: support first level
 */
floorPivots = function (values) {

  var result = new Array();
  var avg = {r3:0, r2:0, r1:0, pl: 0, s1:0, s2:0, s3:0};

  for (var i = 0; i < values.length; i++)
  {
    pivotLevel = (parseFloat(values[i].h) + parseFloat(values[i].l) + parseFloat(values[i].c)) / 3;
    r1 = (2 * parseFloat(pivotLevel)) - parseFloat(values[i].l);
    r2 = parseFloat(pivotLevel) + parseFloat(values[i].h) - parseFloat(values[i].l);
    r3 = parseFloat(r1) + parseFloat(values[i].h) - parseFloat(values[i].l);
    s1 = (2 * parseFloat(pivotLevel) )- parseFloat(values[i].h);
    s2 = parseFloat(pivotLevel) - parseFloat(values[i].h) + parseFloat(values[i].l);
    s3 = parseFloat(s1) - parseFloat(values[i].h) + parseFloat(values[i].l);
    elem = {r3:r3, r2:r2, r1:r1, pl: pivotLevel, s1:s1, s2:s2, s3:s3};
    result.push(elem);
  }

  var final = reverseAppend(values, result, "floor");

  return final
}

////////////////////////////////////////////////////////

/**
 * Returns the Tom Demark points, the predicted low and highs
 * of the period.
 * These values for a given day are calculated based on the day before
 * so expect n values as output for a given list of n days.
 * The result is a list of elements with fields:
 *         - low: predicted low value.
 *         - high: predicted high value.
 */
tomDemarksPoints = function (values) {
  var result = new Array();
  for (var i = 0; i < values.length; i++)
  {
    var x = 0;
    if (values[i].c < values[i].o)
    {
      x = values[i].h + (2 * (values[i].l) + values[i].c);
    }
    if (values[i].c > values[i].o)
    {
      x = (2 * values[i].h) +  values[i].l + values[i].c;
    }
    if (values[i].c == values[i].o)
    {
      x = values[i].h + values[i].l + (2 * values[i].c);
    }
    newHigh = (x/2) - values[i].l;
    newLow = (x/2) - values[i].h;
    elem = {l: newLow, h: newHigh};
    result.push(elem);
  }
  return reverseAppend(values, result, "tom");
}

////////////////////////////////////////////////////////

/**
 * Returns the Woodies points: pivot, supports (s1 and s2) and
 * resistance values (r1 and r2).
 * These values for a given day are calculated based on the day before
 * so expect n values as output for a given list of n days.
 * The result is a list of elements with fields:
 *         - pivot: predicted pivot value.
 *         - s1: predicted support (s1).
 *         - r1: predicted resistance (r1).
 *         - r2: predicted secondary resistance (r2).
 *         - s2: predicted secondary support (s2).
 */
woodiesPoints = function (values) {
  var result = new Array();
  for (var i = 0; i < values.length; i++)
  {
    var x = 0;
    var pivot = (values[i].h + values[i].l + 2 * values[i].c) / 4;
    var r1 = (2 * pivot) - values[i].l;
    var r2 = pivot + values[i].h - values[i].l;
    var s1 = (2 * pivot) - values[i].h;
    var s2 = pivot - values[i].h + values[i].l;
    elem = {pivot: pivot, r1: r1,
            s1: s1, s2: s2, r2: r2};
    result.push(elem);
  }
  return reverseAppend (values, result, "wood");
}

////////////////////////////////////////////////////////

/**
 * Returns the Camarilla points: supports (s1,s2,3 and s4)) and
 * resistance values (r1, r2, r3 and r4).
 * The result is a list of elements with fields:
 *         - s1: predicted s1 support.
 *         - s2: predicted s2 support.
 *         - s3: predicted s3 support.
 *         - s4: predicted s4 support.
 *         - r1: predicted r1 resistance.
 *         - r2: predicted r2 resistance.
 *         - r3: predicted r3 resistance.
 *         - r4: predicted r4 resistance.
 */
camarillaPoints = function (values) {
  var result = new Array();
  for (var i = 0; i < values.length; i++)
  {

    var diff = parseFloat(values[i].h) - parseFloat(values[i].l);
    var r4 = ((diff * 1.1) / 2) + parseFloat(values[i].c);
    var r3 = (diff *1.1) / 4 + parseFloat(values[i].c);
    var r2 = (diff * 1.1) / 6 + parseFloat(values[i].c);
    var r1 = (diff * 1.1) / 12 + parseFloat(values[i].c);
    var s1 = parseFloat(values[i].c) - (diff * 1.1 / 12);
    var s2 = parseFloat(values[i].c) - (diff *1.1 /6);
    var s3 = parseFloat(values[i].c) - (diff * 1.1 / 4);
    var s4 = parseFloat(values[i].c) - (diff *1.1 / 2);

    elem = {r4: r4, r3: r3, r2: r2, r1: r1, s1: s1, s2: s2, s3: s3,
            s4: s4};

    result.push(elem);

  }

  return reverseAppend(values, result, "cam");

}



////////////////////////////////////////////////////////

fibonacciRetrs = function (values, trend)
{
  var result = new Array();
  var retracements = [1, 0.618, 0.5, 0.382, 0.236, 0];
    for (var i = 0; i < values.length; i++) {
      var diff = parseFloat(values[i].h) - parseFloat(values[i].l);
      var elem = new Array();
      for (var r = 0; r < retracements.length; r++)
      {
        var level = 0;

        if (!trend) // downtrend
          level = parseFloat(values[i].h) - diff * parseFloat(retracements[r]);
        else
          level = parseFloat(values[i].l) + diff * parseFloat(retracements[r]);

        elem.push(level);
      }
      result.push(elem);
    }
  return result
}

var init_data = function(instrument, done) {

    //
    var ts = Math.round(new Date().getTime() / 1000);
	var tsAgo = new Date(ts - (1 * 24 * 3600));
	var tsStart = (new Date(tsAgo * 1000)).toISOString();
	var tsEnd = (new Date(ts * 1000)).toISOString();

	// GDAX: the granularity field must be one of the following values: {60, 300, 900, 3600, 21600, 86400}
	var granularity = 86400

	var options = {
		url: 'https://api.gdax.com/products/' + instrument + '/candles?start=' + tsStart + '&end=' + tsEnd + '&granularity=' + granularity,
		headers: {
			'User-Agent': 'request'
		}
	}

  //console.log(options)

	request.get(options, function (err, res, body){

		var o_body = JSON.parse(body);

		if (o_body.message) {
			console.log('Error from Web Request:', o_body.message);
			throw "Request Error", o_body.message
		}

	  	s = {
	  		'lookback' : o_body
	  	};

	  //console.log('Retrieved Candles', s)

		done(s);

	});


}

// [ time, low, high, open, close, volume ]
const CANDLE_TS=0
const CANDLE_LOW=1
const CANDLE_HIGH=2
const CANDLE_OPEN=3
const CANDLE_CLOSE=4

var process_data = function(data) {

  var in_data = data.lookback

  //console.log('data', data);
  //console.log('in_data', in_data);
  //console.log('in_data', in_data.length)

  //create object for talib. only close is used for now but rest might come in handy
  //var market = { c: in_data.lookback[CANDLE_CLOSE], h: in_data.lookback[CANDLE_HIGH], l: in_data.lookback[CANDLE_LOW], o: in_data.lookback[CANDLE_OPEN]};
  var high = new Array()
  for (var i = (in_data.length - high.length) - 1; i >= 0; i--) {
    //console.log('add data')
    high.push(in_data[i][CANDLE_HIGH]);
  }

  var low = new Array()
  for (var i = (in_data.length - low.length) - 1; i >= 0; i--) {
    //console.log('add data')
    low.push(in_data[i][CANDLE_LOW]);
  }

  var open = new Array()
  for (var i = (in_data.length - open.length) - 1; i >= 0; i--) {
    //console.log('add data')
    open.push(in_data[i][CANDLE_OPEN]);
  }

  var close = new Array()
  for (var i = (in_data.length - close.length) - 1; i >= 0; i--) {
    //console.log('add data', in_data[i], in_data[i][CANDLE_CLOSE])
    close.push(in_data[i][CANDLE_CLOSE]);
  }

  var ts = new Array()
  for (var i = (in_data.length - ts.length) - 1; i >= 0; i--) {
    ts.push(in_data[i][CANDLE_TS]);
  }
  //console.log('close', close)
  // Remap data like this
  //    {high: 21, low: 19, close: 19.5},
  let market = _.zip(
      close,
      high,
      low,
      open
    ).map(x => ({
      c: x[0],
      h: x[1],
      l: x[2],
      o: x[3]
    }));

  var floorValues = floorPivots (market);


  floorValues = tomDemarksPoints(floorValues);


  floorValues = woodiesPoints(floorValues);


  floorValues = camarillaPoints(floorValues);


    return floorValues[floorValues.length - 2]

}

// Finalize the export to process the support/pivot/resistance
module.exports = function (instrument, cb) {

  var in_data = instrument;

  // Check if we pull our own data or use data provided
  if (typeof instrument === 'string') {

  	// We are going to be creating our data set
  	init_data(instrument, function(sr) {

  		var data = process_data(sr);

  		//console.log('SR', data)

  		cb(data);

  	});

  } else {

  	// Use inbound datga
  	var data = process_data(instrument);

  	//console.log('SR', data)

  	cb(data);

  }
}
