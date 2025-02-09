use reqwest;
use scraper::{Html, Selector};
use serde::{Deserialize, Serialize};
use std::{env, error::Error, fs::File, io, process};

const SELECTOR: &str = r#"#ProductPrice-product"#;

const HELP: &str = "fanatics update urls.csv > prices.csv
fanatics readme prices.csv > README.md
";

const AGENT: &str = "https://github.com/eyeseast/fanatics";

#[derive(Debug, Deserialize)]
struct Record {
    name: String,
    url: String,
    price: String,
}

#[derive(Debug, Serialize)]
struct Price {
    name: String,
    url: String,
    current: String,
    usual: String,
}

struct Config {
    cmd: String,
    target: String,
}

impl Config {
    fn build(args: &[String]) -> Result<Config, &'static str> {
        if args.len() < 3 {
            return Err(&HELP);
        }

        let cmd = args[1].clone();
        let target = args[2].clone();

        Ok(Config { cmd, target })
    }
}

fn main() {
    let args: Vec<String> = env::args().collect();
    let config: Config = Config::build(&args).unwrap_or_else(|err| {
        eprintln!("{err}");
        process::exit(1);
    });

    if config.cmd == "update" {
        let _ = update(config.target);
    } else if config.cmd == "readme" {
        readme(config.target);
    }
}

// read urls.csv and write prices to stdout
fn update(urls: String) -> Result<(), Box<dyn Error>> {
    let file = File::open(urls).expect("problem reading {urls}");
    let mut reader = csv::Reader::from_reader(file);
    let mut writer = csv::Writer::from_writer(io::stdout());

    for row in reader.deserialize() {
        let record: Record = row?;
        let html: String;
        match fetch(&record.url) {
            Ok(s) => html = s,
            Err(err) => {
                eprint!("problem fetching: {err}");
                continue;
            }
        }

        let extracted = scrape(&html);
        let price = Price {
            name: record.name,
            url: record.url,
            current: extracted,
            usual: record.price,
        };

        writer.serialize(price)?;
    }

    writer.flush()?;

    Ok(())
}

// read prices.csv and write README to stdout
fn readme(_prices: String) {}

// fetch a URL and return html as text
fn fetch(url: &str) -> Result<String, reqwest::Error> {
    let client = reqwest::blocking::Client::builder()
        .user_agent(AGENT)
        .build()?;
    let res = client.get(url).send()?;
    res.text()
    //reqwest::blocking::get(url)?.text()
}

fn scrape(html: &str) -> String {
    let doc = Html::parse_document(html);
    let selector = Selector::parse(SELECTOR).unwrap();
    let title_selector = Selector::parse("title").unwrap();

    match doc.select(&title_selector).next() {
        Some(t) => {
            let title: Vec<&str> = t.text().collect();
            let title = title.join("");
            println!("{title}");
        }
        None => println!("no title"),
    }

    let mut price = String::new();
    for el in doc.select(&selector) {
        // let html = el.html();
        // println!("found {html}");
        let text: Vec<&str> = el.text().collect();

        if text.len() > 0 {
            price = text.join("");
            break;
        }
    }
    /*
    match doc.select(&selector).next() {
        Some(el) => price = el.inner_html(),
        None => price = String::new(),
    }*/

    price
}
