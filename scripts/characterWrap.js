const characterWrap = (title, element, className) => {
  // RETURN CLASS
  let wrapperClass = className !== undefined ? ` class="${className}"` : ''
  // TITLE
  const titleArray = title.split('')
  let newTitle = []
  titleArray.forEach(char => {
    newTitle.push(`<${element}${wrapperClass}>${char}</${element}>`)
  });
  return newTitle.join('')
}

export default characterWrap;
