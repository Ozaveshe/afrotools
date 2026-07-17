"""
AfroTools API Client — Python

Usage:
    from afrotools import AfroTools

    client = AfroTools("afro_your_api_key")

    # List all countries
    countries = client.tax.countries()

    # Calculate Nigerian PAYE
    result = client.tax.calculate(country="NG", income=5_000_000)

    # Get latest forex rates
    rates = client.forex.latest()

    # Get VAT rates
    vat_rates = client.vat.rates()

Requirements:
    pip install requests

Version: 1.0.0
License: MIT
"""

import requests


class AfroToolsError(Exception):
    """Raised when the AfroTools API returns an error."""

    def __init__(self, message, status_code=None, data=None):
        super().__init__(message)
        self.status_code = status_code
        self.data = data


class _TaxAPI:
    """Tax (PAYE) endpoints."""

    def __init__(self, client):
        self._client = client

    def countries(self):
        """List all supported African countries with tax info.

        Returns:
            dict: List of countries with tax bracket information.
        """
        return self._client._get("/tax")

    def country(self, code):
        """Get tax info for a specific country.

        Args:
            code: ISO 3166-1 alpha-2 country code (e.g. 'NG', 'KE', 'ZA').

        Returns:
            dict: Country tax brackets and details.
        """
        return self._client._get("/tax", params={"country": code})

    def calculate(self, **kwargs):
        """Calculate income tax (PAYE).

        Keyword Args:
            country (str): Country code (e.g. 'NG').
            income (float): Annual gross income in local currency.
            direction (str, optional): 'gross-to-net' (default) or 'net-to-gross'.

        Returns:
            dict: Tax breakdown with brackets, effective rate, net income.
        """
        return self._client._post("/tax", json=kwargs)


class _ForexAPI:
    """Foreign exchange rate endpoints."""

    def __init__(self, client):
        self._client = client

    def latest(self, **params):
        """Get latest exchange rates for African currencies.

        Keyword Args:
            base (str, optional): Base currency code (default: USD).
            symbols (str, optional): Comma-separated target currencies.

        Returns:
            dict: Exchange rates with timestamp.
        """
        return self._client._get("/forex", params=params)


class _FuelAPI:
    """Fuel price endpoints."""

    def __init__(self, client):
        self._client = client

    def prices(self, country=None):
        """Get fuel prices across Africa.

        Args:
            country (str, optional): Filter by country code.

        Returns:
            dict: Fuel prices (petrol, diesel, kerosene) by country.
        """
        params = {}
        if country:
            params["country"] = country
        return self._client._get("/fuel", params=params)


class _RatesAPI:
    """Central bank interest rate endpoints."""

    def __init__(self, client):
        self._client = client

    def all(self):
        """Get all central bank interest rates.

        Returns:
            dict: Interest rates for all tracked African countries.
        """
        return self._client._get("/rates")

    def country(self, code):
        """Get interest rate for a specific country.

        Args:
            code: ISO 3166-1 alpha-2 country code.

        Returns:
            dict: Interest rate details for the country.
        """
        return self._client._get("/rates", params={"country": code})


class _VATAPI:
    """VAT calculation endpoints."""

    def __init__(self, client):
        self._client = client

    def rates(self):
        """Get VAT rates for all supported countries.

        Returns:
            dict: VAT rates by country.
        """
        return self._client._get("/vat")

    def calculate(self, **kwargs):
        """Calculate VAT (add or extract).

        Keyword Args:
            country (str): Country code (e.g. 'NG').
            amount (float): The amount to calculate VAT on.
            direction (str): 'add' to add VAT, 'extract' to extract from inclusive amount.

        Returns:
            dict: VAT breakdown with net, vat, and gross amounts.
        """
        return self._client._post("/vat", json=kwargs)


class AfroTools:
    """AfroTools API client.

    Args:
        api_key: Your AfroTools API key (starts with ``afro_``).
        base_url: Override the default API base URL.
        timeout: Request timeout in seconds (default: 30).

    Example::

        client = AfroTools("afro_your_api_key")
        result = client.tax.calculate(country="NG", income=5_000_000)
        print(result)
    """

    DEFAULT_BASE_URL = "https://afrotools.com/api"

    def __init__(self, api_key, base_url=None, timeout=30):
        if not api_key:
            raise ValueError("AfroTools: api_key is required")

        self.api_key = api_key
        self.base_url = (base_url or self.DEFAULT_BASE_URL).rstrip("/")
        self.timeout = timeout
        self._session = requests.Session()
        self._session.headers.update({"x-api-key": self.api_key})

        # Endpoint groups
        self.tax = _TaxAPI(self)
        self.forex = _ForexAPI(self)
        self.fuel = _FuelAPI(self)
        self.rates = _RatesAPI(self)
        self.vat = _VATAPI(self)

    def _get(self, path, params=None):
        """Send a GET request to the API."""
        url = self.base_url + path
        resp = self._session.get(url, params=params, timeout=self.timeout)
        return self._handle_response(resp)

    def _post(self, path, json=None):
        """Send a POST request to the API."""
        url = self.base_url + path
        resp = self._session.post(url, json=json, timeout=self.timeout)
        return self._handle_response(resp)

    @staticmethod
    def _handle_response(resp):
        """Parse JSON response and raise on errors."""
        try:
            data = resp.json()
        except ValueError:
            raise AfroToolsError(
                f"Invalid JSON response (HTTP {resp.status_code})",
                status_code=resp.status_code,
            )
        if not resp.ok:
            msg = data.get("error", f"API error {resp.status_code}")
            raise AfroToolsError(msg, status_code=resp.status_code, data=data)
        return data

    def close(self):
        """Close the underlying HTTP session."""
        self._session.close()

    def __enter__(self):
        return self

    def __exit__(self, *args):
        self.close()
