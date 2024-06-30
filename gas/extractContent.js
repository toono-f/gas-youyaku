// 参考: https://qiita.com/takatama/items/6f86d0d1e0de601506b5#fn-1

// Original Code:: https://github.com/kanjirz50/python-extractcontent3
// Fork of:: https://github.com/petitviolet/python-extractcontent
// Fork of:: https://github.com/yono/python-extractcontent
// Fork of:: extractcontent.rb https://labs.cybozu.co.jp/blog/nakatani/2007/09/web_1.html
// Original extractcontent.rb's Author:: Nakatani Shuyo
// Original extractcontent.rb's Copyright:: (c)2007 Cybozu Labs Inc. All rights reserved.
// License:: BSD
class ExtractContent {
  constructor(opt = null) {
    // デフォルトのオプションパラメータ
    this.option = {
      threshold: 100, // スコアの閾値
      min_length: 80, // ブロックの最小長さ
      decay_factor: 0.73, // スコアの減衰係数
      continuous_factor: 1.62, // 連続ブロックの係数
      punctuation_weight: 10, // 句読点の重み
      punctuations:
        /[\u3001\u3002\uff01\uff0c\uff0e\uff1f]|\.[^A-Za-z0-9]|,[^0-9]|!|\?/g, // 句読点の正規表現
      waste_expressions: /Copyright|All Rights Reserved/i, // 不要な表現の正規表現
      debug: false, // デバッグモード
    };

    if (opt !== null) {
      this.setOption(opt);
    }

    this.title = ""; // タイトル
    this.body = ""; // 本文

    this.charRef = {
      nbsp: " ", // スペース
      lt: "<", // <
      gt: "<", // >
      amp: "&", // &
      laquo: "\x00\xab", // <<
      raquo: "\x00\xbb", // >>
    };
  }

  setOption(opt) {
    // 現在のオプションと提供されたオプションをマージする
    this.option = { ...this.option, ...opt };
  }

  _eliminateUselessTags(html) {
    // 不要な記号を除去
    html = html.replace(
      /[\u2018-\u201d\u2190-\u2193\u25a0-\u25bd\u25c6-\u25ef\u2605-\u2606]/g,
      ""
    );
    // 不要なHTMLタグを除去
    html = html.replace(
      /<(script|style|select|noscript)[^>]*>.*?<\/\1\s*>/gis,
      ""
    );
    html = html.replace(/<!--.*?-->/gs, "");
    html = html.replace(/<![A-Za-z].*?>/gs, "");
    html = html.replace(
      /<(?:div|center|td)[^>]*>|<p\s*[^>]*class\s*=\s*["']?(?:posted|plugin-\w+)['"]?[^>]*>/gis,
      ""
    );
    return html;
  }

  _extractTitle(st) {
    const result = /<title[^>]*>\s*(.*?)\s*<\/title\s*>/is.exec(st);
    if (result !== null) {
      return this._stripTags(result[0]);
    } else {
      return "";
    }
  }

  _extractOgImage(html) {
    const ogImageMatch = html.match(
      /<meta[^>]*property=["']og:image["'][^>]*content=["'](.*?)["']/i
    );
    return ogImageMatch ? ogImageMatch[1] : "";
  }

  _splitToBlocks(html) {
    return html.split(
      /<\/?(?:div|center|td)[^>]*>|<p\s*[^>]*class\s*=\s*["']?(?:posted|plugin-\w+)['"]?[^>]*>/gi
    );
  }

  _countPattern(text, pattern) {
    const result = text.match(pattern);
    if (result === null) {
      return 0;
    } else {
      return result.length;
    }
  }

  _estimateTitle(match) {
    const stripped = this._stripTags(match[2]);
    if (stripped.length >= 3 && this.title.includes(stripped)) {
      return `<div>${stripped}</div>`;
    } else {
      return match[1];
    }
  }

  _hasOnlyTags(st) {
    st = st.replace(/<[^>]*>/gis, "");
    st = st.replace(/&nbsp;/g, "");
    st = st.trim();
    return st.length === 0;
  }

  _eliminateLink(html) {
    let count = 0;
    const notLinked = html.replace(/<a\s[^>]*>.*?<\/a\s*>/gis, (match) => {
      count++;
      return "";
    });
    const notLinkedFinal = notLinked.replace(
      /<form\s[^>]*>.*?<\/form\s*>/gis,
      ""
    );
    const notLinkedStripped = this._stripTags(notLinkedFinal);
    // リンクが多い場合やリンクのリストの場合は空の文字列を返す
    if (notLinkedStripped.length < 20 * count || this._isLinkList(html)) {
      return "";
    }
    return notLinkedStripped;
  }

  _isLinkList(st) {
    const result = /<(?:ul|dl|ol)(.+?)<\/(?:ul|dl|ol)>/is.exec(st);
    if (result !== null) {
      const listPart = result[1];
      const outside = st.replace(/<(?:ul|dl)(.+?)<\/(?:ul|dl)>/gis, "");
      const strippedOutside = outside
        .replace(/<.+?>/gis, "")
        .replace(/\s+/g, "");
      const list = listPart.split(/<li[^>]*>/gi);
      const rate = this._evaluateList(list);
      return strippedOutside.length <= st.length / (45 / rate);
    }
    return false;
  }

  _evaluateList(list) {
    if (list.length === 0) {
      return 1;
    }
    let hit = 0;
    const href = /<a\s+href=(['"]?)([^"'\s]+)\1/gi;
    for (let line of list) {
      if (href.test(line)) {
        hit++;
      }
    }
    return 9 * Math.pow((1.0 * hit) / list.length, 2) + 1;
  }

  _stripTags(html) {
    let st = html.replace(/<.+?>/gs, "");
    // 全角文字を半角文字に変換
    st = st.normalize("NFKC");
    st = st.replace(/[\u2500-\u253f\u2540-\u257f]/g, ""); // 罫線(keisen)
    st = st.replace(/&(.*?);/g, (match, p1) => {
      return this.charRef[p1] || match;
    });
    st = st.replace(/[ \t]+/g, " ");
    st = st.replace(/\n\s*/g, "\n");
    return st;
  }

  asHtml() {
    return { body: this.body, title: this.title, image: this.image };
  }

  asText() {
    return {
      body: this._stripTags(this.body),
      title: this.title,
      image: this.image,
    };
  }

  analyse(html, opt = null) {
    // frameset やリダイレクトの場合
    if (
      /<\/frameset>|<meta\s+http-equiv\s*=\s*["']?refresh['"]?[^>]*url/i.test(
        html
      )
    ) {
      return ["", this._extractTitle(html)];
    }

    // オプションパラメータ
    if (opt) {
      this.setOption(opt);
    }

    // ヘッダーとタイトル
    const header = /<\/head\s*>/i.exec(html);
    if (header !== null) {
      const headContent = html.slice(0, header.index);
      this.title = this._extractTitle(headContent);
      this.image = this._extractOgImage(headContent);
    } else {
      this.title = this._extractTitle(html);
      this.image = this._extractOgImage(html);
    }

    // Google AdSense セクションターゲット
    html = html.replace(
      /<!--\s*google_ad_section_start\(weight=ignore\)\s*-->.*?<!--\s*google_ad_section_end.*?-->/gis,
      ""
    );
    if (/<!--\s*google_ad_section_start[^>]*-->/i.test(html)) {
      const result = html.match(
        /<!--\s*google_ad_section_start[^>]*-->.*?<!--\s*google_ad_section_end.*?-->/gis
      );
      html = result.join("\n");
    }

    // 不要なテキストを除去
    html = this._eliminateUselessTags(html);

    // タイトルを含む見出しタグ
    html = html.replace(
      /(<h\d\s*>\s*(.*?)\s*<\/h\d\s*>)/gis,
      this._estimateTitle.bind(this)
    );

    // テキストブロックを抽出
    let factor = 1.0;
    let continuous = 1.0;
    let body = "";
    let score = 0;
    let bodylist = [];
    const blockList = this._splitToBlocks(html);
    for (let block of blockList) {
      if (this._hasOnlyTags(block)) {
        continue;
      }

      if (body.length > 0) {
        continuous /= this.option.continuous_factor;
      }

      // リンクリストブロックを無視
      const notlinked = this._eliminateLink(block);
      if (notlinked.length < this.option.min_length) {
        continue;
      }

      // ブロックのスコアを計算
      let c =
        (notlinked.length +
          (notlinked.match(this.option.punctuations) || []).length *
            this.option.punctuation_weight) *
        factor;
      factor *= this.option.decay_factor;
      const notBodyRate =
        (block.match(this.option.waste_expressions) || []).length +
        (block.match(/amazon[a-z0-9\.\/\-\?&]+-22/gi) || []).length / 2.0;
      if (notBodyRate > 0) {
        c *= Math.pow(0.72, notBodyRate);
      }
      const c1 = c * continuous;
      if (this.option.debug) {
        console.log(
          `----- ${c}*${continuous}=${c1} ${
            notlinked.length
          } \n${this._stripTags(block).slice(0, 100)}`
        );
      }

      // 連続するブロックをクラスターとして扱う
      if (c1 > this.option.threshold) {
        body += block + "\n";
        score += c1;
        continuous = this.option.continuous_factor;
      } else if (c > this.option.threshold) {
        // 連続するブロックの終了
        bodylist.push({ body, score });
        body = block + "\n";
        score = c;
        continuous = this.option.continuous_factor;
      }
    }

    bodylist.push({ body, score });
    body = bodylist.reduce((prev, current) =>
      prev.score >= current.score ? prev : current
    );
    this.body = body.body;

    return this;
  }
}
