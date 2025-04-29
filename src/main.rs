use reqwest;
use scraper::{Html, Selector};
use serde::{Deserialize, Serialize};
use std::{env, error::Error, fs::File, io, process};

const SELECTOR: &str = r#"#ProductPrice-product span"#;

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

#[derive(Debug, Serialize, Deserialize)]
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
        let _ = readme(&config.target);
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
fn readme(prices: &str) -> Result<(), Box<dyn Error>> {
    let file = File::open(prices).expect("problem reading file: {prices}");
    let mut reader = csv::Reader::from_reader(file);

    // header
    println!(
        "# fanatics

Current prices:
"
    );

    for row in reader.deserialize() {
        let price: Price = row?;
        println!(
            "- [{name}]({url}): {current} (${usual})",
            name = price.name,
            url = price.url,
            current = price.current,
            usual = price.usual,
        )
    }

    Ok(())
}

// fetch a URL and return html as text
fn fetch(url: &str) -> Result<String, reqwest::Error> {
    let client = reqwest::blocking::Client::builder()
        .user_agent(AGENT)
        .build()?;
    let res = client.get(url).send()?;
    res.text()
}

fn scrape(html: &str) -> String {
    let doc = Html::parse_document(html);
    let selector = Selector::parse(SELECTOR).unwrap();

    let mut price = String::new();
    for el in doc.select(&selector) {
        let text: Vec<&str> = el.text().collect();
        if text.len() > 0 {
            price = text.join("").trim().to_string();
            break;
        }
    }

    price
}
