// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0; // <-- version directive

// imports
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Character is ERC721URIStorage, Ownable {
  using Counters for Counters.Counter;
  using SafeMath for uint256;

  Counters.Counter private _tokenIds;

  // these are all optional params we might create for our characters
  uint256 fee = 0.00 ether; // <-- any fees we want to change on txs
  uint256 public constant maxSupply = 10000; // <-- max supply of tokens
  uint256 public maxMintAmountPerTx = 1; // <-- max mints per tx
  uint256 public perAddressLimit = 10; // <-- max
  bool public paused = false; // <-- stop interaction witb contract
  address public contractOwner; // <-- game dev/studio wallet address

  // charcter traits (on-chain)
  // id, dna, level, rarity, evac, tokenURI
  struct Char {
    uint256 id;
    uint256 dna;
    uint8 level;
    uint8 rarity;
    uint256 evac;
    string tokenURI;
    uint256 hp;
    uint256 damage;
  }
  // mapping char to token count
  Char[maxSupply] public _tokenDetails;
  // set-up event for emitting once character minted to read out values
  event NewChar(address indexed owner, uint256 id, uint256 dna);

  mapping(address => uint256) public addressMintedBalance; // <-- used to check how many an account has minted for `maxMintAmountPerTx`

  // we begin constructing token: ERC721 standard
  constructor() ERC721("Character", "CHAR") {
    contractOwner = msg.sender; 
  }

  // TODO: use chainLink
  function _createRandomNum(uint256 _mod) internal view returns (uint256) {
    uint256 randomNum = uint256(
      keccak256(abi.encodePacked(block.timestamp, msg.sender))
    );
    return randomNum % _mod;
  }

  
  modifier mintCompliance(uint256 _mintAmount) {
    require(!paused, "The contract is paused.");

    // condition: insufficient account balance
    require(msg.value <= msg.sender.balance, "Insufficient balance.");

    // condition: minting at least 1 or more
    require(
      _mintAmount > 0 && _mintAmount <= maxMintAmountPerTx,
      "Invalid mint amount."
    );

    // condition: total minted + this potential tx is under maxsupply
    require(
      _tokenIds.current() + _mintAmount <= maxSupply,
      "Max supply exceeded."
    );

    // condition: value more than fee
    // TODO: opensea won't let list with fee(?)
    require(msg.value >= fee * _mintAmount, "Insufficient funds.");

    uint256 ownerMintedCount = addressMintedBalance[msg.sender];
    // condition: minting limit per address
    require(
      ownerMintedCount + _mintAmount <= perAddressLimit,
      "Max NFT per address exceeded."
    );
    _;
  }

 
  function getTokenDetails(uint256 _id) public view returns (Char memory) {
    return _tokenDetails[_id];
  }
  


  function getTokenCirculations() public view returns (uint256) {
    return _tokenIds.current();
  }
 

  


  function tokenURI(uint256 _id)
    public
    view
    virtual
    override
    returns (string memory)
  {
    require(_exists(_id), "ERC721Metadata: URI query for nonexistent token");
      return _tokenDetails[_id].tokenURI;
  }



  function mintToken(uint256 _mintAmount, string memory _tokenURI)
    public
    payable
    mintCompliance(_mintAmount)
  {
    _tokenIds.increment();
    uint256 newCharID = _tokenIds.current();

    _safeMint(msg.sender, newCharID);
    _setTokenURI(newCharID, _tokenURI);

    uint8 randRarity = uint8(_createRandomNum(100));
    uint256 randDna = _createRandomNum(10**16);

    // id, dna, level, rarity, evac, tokenURI, hp, damage
    Char memory newChar = Char(
      newCharID,
      randDna,
      1,
      randRarity,
      block.timestamp,
      _tokenURI,
      100,
      5
    );

    _tokenDetails[newCharID] = newChar;

    // check for addresses already minted
    for (uint256 i = 1; i <= _mintAmount; i++) {
      addressMintedBalance[msg.sender]++;
    }

    emit NewChar(msg.sender, newCharID, randDna);
  }


//   function updateHp(uint256 _id,uint256 _hp) public onlyOwner{
//     require(_hp>=0, "hp value error");
//     Char storage char = _tokenDetails[_id];
//     char.hp = _hp;
//   }

//   function updateDamage(uint256 _id,string memory _uri,uint256 _damage) public onlyOwner{
//     updateMetadata(_id,_uri);
//     Char storage char = _tokenDetails[_id];
//     char.damage = _damage;
//   }

//   function updateLevel(uint256 _id,string memory _uri) public onlyOwner{
//     updateMetadata(_id,_uri);
//     Char storage char = _tokenDetails[_id];
//     char.level++;
//   }
  
  function updateMetadata(
    uint256 _id,
    string memory _uri,
    uint8 _level,
    uint256 _hp,
    uint256 _damage
  ) public onlyOwner {
    require(_exists(_id), "ERC721URIStorage: URI set of nonexistent token");
    Char storage char = _tokenDetails[_id];
    char.tokenURI = _uri;
    char.level = _level;
    char.hp = _hp;
    char.damage = _damage;
    _setTokenURI(_id, _uri);
  }

  function updateFee(uint256 _fee) external onlyOwner {
    fee = _fee;
  }

  function withdraw() external payable onlyOwner {
    // This will transfer the remaining contract balance to the owner (contractOwner address).
    // Do not remove this otherwise you will not be able to withdraw the funds.
    // =============================================================================
    (bool os, ) = payable(owner()).call{value: address(this).balance}("");
    require(os);
    // =============================================================================
  }
}
