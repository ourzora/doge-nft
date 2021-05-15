import randomColor from './randomColor'

export default (title, element, className) => {
  // RETURN CLASS
  let wrapperClass = className !== undefined ? ` class="${className}"` : ''
  // TITLE
  const titleArray = title.split('')
  let newTitle = []
  titleArray.forEach(char => {
    console.log(char)
    newTitle.push(`<${element}${wrapperClass} style="color: ${randomColor()}">${char}</${element}>`)
  });
  return newTitle.join('')
}